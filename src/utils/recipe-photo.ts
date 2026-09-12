import * as FileSystem from 'expo-file-system/legacy';

import { createId } from '@/utils/id';

const PHOTO_DIR_NAME = 'recipe-photos';

function getDocumentBase(): string | null {
  return FileSystem.documentDirectory;
}

function getPhotoDirectoryUri(): string {
  const base = getDocumentBase();
  if (!base) {
    throw new Error('App document directory is unavailable.');
  }
  return `${base}${PHOTO_DIR_NAME}/`;
}

/** True when `stored` is a full media URI (legacy picker/cache paths). */
export function isAbsoluteMediaUri(stored: string): boolean {
  return /^(file|content|ph|assets-library|http|https):/i.test(stored);
}

function extensionFromUri(uri: string): string {
  const cleaned = uri.split('?')[0] ?? uri;
  const match = cleaned.match(/\.([a-zA-Z0-9]+)$/);
  if (!match) return '.jpg';
  const ext = match[1].toLowerCase();
  if (ext === 'jpeg' || ext === 'jpg' || ext === 'png' || ext === 'webp' || ext === 'heic') {
    return `.${ext === 'jpeg' ? 'jpg' : ext}`;
  }
  return '.jpg';
}

async function ensurePhotoDirectory(): Promise<string> {
  const dir = getPhotoDirectoryUri();
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }
  return dir;
}

/**
 * Copies a picker/camera image into the app documents folder and returns a
 * relative path (stable across documentDirectory base URI changes).
 */
export async function persistRecipePhoto(sourceUri: string): Promise<string> {
  const dir = await ensurePhotoDirectory();
  const filename = `${createId('photo')}${extensionFromUri(sourceUri)}`;
  const destination = `${dir}${filename}`;
  await FileSystem.copyAsync({ from: sourceUri, to: destination });
  return `${PHOTO_DIR_NAME}/${filename}`;
}

/**
 * Resolves a stored recipe photo path to a usable Image URI.
 * Supports new relative paths and legacy absolute picker/cache URIs.
 */
export function resolveRecipePhotoUri(stored: string | null | undefined): string | null {
  if (!stored) return null;
  if (isAbsoluteMediaUri(stored)) return stored;
  const base = getDocumentBase();
  if (!base) return null;
  return `${base}${stored}`;
}

/**
 * Creates a new persisted copy of an existing recipe photo (relative or absolute).
 * Returns a new relative path, or null if there was nothing to copy.
 */
export async function copyPersistedRecipePhoto(
  stored: string | null | undefined,
): Promise<string | null> {
  if (!stored) return null;
  const sourceUri = resolveRecipePhotoUri(stored);
  if (!sourceUri) return null;
  return persistRecipePhoto(sourceUri);
}

/** Deletes a persisted relative photo file. No-ops for legacy absolute URIs. */
export async function deletePersistedRecipePhoto(
  stored: string | null | undefined,
): Promise<void> {
  if (!stored || isAbsoluteMediaUri(stored)) return;
  const uri = resolveRecipePhotoUri(stored);
  if (!uri) return;
  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch {
    // Ignore missing files.
  }
}
