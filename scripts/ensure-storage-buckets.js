#!/usr/bin/env node

/**
 * Ensure required Supabase Storage buckets exist.
 *
 * Why: inserting into storage.buckets via SQL can be incompatible with some Supabase
 * storage deployments; the Storage API is the most reliable way.
 *
 * Usage:
 *   node scripts/ensure-storage-buckets.js
 */

const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {}
  const map = {}
  const content = fs.readFileSync(filePath, 'utf8')
  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const idx = line.indexOf('=')
    if (idx < 1) continue
    const key = line.slice(0, idx).trim()
    let value = line.slice(idx + 1).trim()
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1)
    map[key] = value
  }
  return map
}

function mustEnv(name, env) {
  const v = process.env[name] || env[name]
  if (!v) {
    console.error(`Missing ${name} in .env.local or process env`)
    process.exit(1)
  }
  return v
}

async function ensureBucket(supabase, id, options) {
  const { data: allBuckets, error: listErr } = await supabase.storage.listBuckets()
  if (listErr) {
    console.error(`listBuckets failed: ${listErr.message}`)
    process.exit(1)
  }

  const { data: existing, error: getErr } = await supabase.storage.getBucket(id)
  if (!getErr && existing) {
    // Try to update settings (best-effort).
    const { error: updErr } = await supabase.storage.updateBucket(id, options)
    if (updErr) {
      console.log(`Bucket ${id}: exists (update skipped: ${updErr.message})`)
    } else {
      console.log(`Bucket ${id}: exists (updated)`)
    }
    return
  }

  const { error: createErr } = await supabase.storage.createBucket(id, options)
  if (createErr) {
    // If a bucket exists with the same *name* but different *id*, Supabase can return "already exists"
    // while getBucket(id) still fails.
    const conflict = (allBuckets || []).find((b) => b.name === id && b.id !== id)
    if (conflict && /already exists/i.test(createErr.message)) {
      console.error(`Bucket ${id}: name already exists but id is different.`)
      console.error(`Conflicting bucket id: ${conflict.id} (name: ${conflict.name})`)
      console.error(`Fix: delete bucket '${conflict.id}' in Supabase Storage, then re-run this script.`)
      process.exit(2)
    }
    console.error(`Bucket ${id}: create failed - ${createErr.message}`)
    process.exit(1)
  }
  console.log(`Bucket ${id}: created`)
}

async function main() {
  const env = readEnvFile(path.join(process.cwd(), '.env.local'))
  const url = mustEnv('NEXT_PUBLIC_SUPABASE_URL', env)
  const serviceKey = mustEnv('SUPABASE_SERVICE_ROLE_KEY', env)

  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } })

  await ensureBucket(supabase, 'voice-messages', {
    public: false,
    fileSizeLimit: 10 * 1024 * 1024,
    allowedMimeTypes: ['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/wav', 'audio/ogg']
  })

  await ensureBucket(supabase, 'chat-attachments', {
    public: false,
    fileSizeLimit: 30 * 1024 * 1024,
    allowedMimeTypes: [
      'image/png',
      'image/jpeg',
      'image/webp',
      'image/gif',
      'audio/webm',
      'audio/mp3',
      'audio/mpeg',
      'audio/wav',
      'audio/ogg',
      'video/mp4',
      'video/webm',
      'video/quicktime',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'application/zip'
    ]
  })

  const { data: buckets, error } = await supabase.storage.listBuckets()
  if (error) {
    console.log(`listBuckets failed: ${error.message}`)
    return
  }
  console.log('Buckets now present:', (buckets || []).map((b) => b.id).sort().join(', '))
}

main().catch((err) => {
  console.error(err?.message || err)
  process.exit(1)
})
