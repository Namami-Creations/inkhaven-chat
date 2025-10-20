// AI Fallback and Retry Logic for Self-Healing

import { logError, logInfo } from './logger-edge';
import { AI_SERVICES, AIChatService } from './ai-services';

// Retry configuration
interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffFactor: number;
}

// Default retry configuration
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffFactor: 2,
};

// Function to execute an AI service call with retries and fallbacks
async function executeWithRetryAndFallback<T>(
  serviceCall: (provider: AIChatService) => Promise<T>,
  providers: readonly AIChatService[] = AI_SERVICES.chatEnhancement as readonly AIChatService[],
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
  operationName: string = 'AI Service Call'
): Promise<T> {
  let lastError: Error | undefined;

  // Iterate through providers as fallbacks
  for (const provider of providers) {
    let retryCount = 0;
    let delay = config.initialDelay;

    // Retry loop for the current provider
    while (retryCount < config.maxRetries) {
      try {
        logInfo(`Attempting ${operationName} with ${provider} (Attempt ${retryCount + 1}/${config.maxRetries})`);
        const result = await serviceCall(provider);
        logInfo(`Successfully completed ${operationName} with ${provider}`);
        return result;
      } catch (error) {
        retryCount++;
        lastError = error instanceof Error ? error : new Error(String(error));
        logError(`Error in ${operationName} with ${provider} (Attempt ${retryCount}/${config.maxRetries})`, lastError);

        if (retryCount === config.maxRetries) {
          logInfo(`Max retries reached for ${provider}. Switching to next provider if available.`);
          break; // Move to next provider
        }

        // Calculate delay with exponential backoff
        delay = Math.min(delay * config.backoffFactor, config.maxDelay);
        logInfo(`Retrying ${operationName} with ${provider} after ${delay}ms delay.`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // If all providers and retries fail, throw the last error
  throw new Error(`All AI providers failed for ${operationName}: ${lastError?.message || 'Unknown error'}`);
}

export { executeWithRetryAndFallback, RetryConfig, DEFAULT_RETRY_CONFIG };
