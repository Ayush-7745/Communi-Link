import {
  BlobSASPermissions,
  BlobServiceClient,
  SASProtocol,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
} from '@azure/storage-blob';

let storageConfigurationPromise;

function parseConnectionString(connectionString) {
  return Object.fromEntries(connectionString.split(';').flatMap((part) => {
    const separator = part.indexOf('=');
    if (separator < 0) return [];
    return [[part.slice(0, separator).toLowerCase(), part.slice(separator + 1)]];
  }));
}

export async function getBlobStorage() {
  if (!storageConfigurationPromise) {
    storageConfigurationPromise = (async () => {
      const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
      const containerName = process.env.AZURE_STORAGE_CONTAINER;
      if (!connectionString || !containerName) {
        const error = new Error('Azure Blob Storage is not configured.');
        error.code = 'AZURE_STORAGE_NOT_CONFIGURED';
        throw error;
      }

      const connectionParts = parseConnectionString(connectionString);
      if (!connectionParts.accountname || !connectionParts.accountkey) {
        const error = new Error('Azure Blob Storage connection string must include account credentials.');
        error.code = 'AZURE_STORAGE_CONFIGURATION_INVALID';
        throw error;
      }

      const serviceClient = BlobServiceClient.fromConnectionString(connectionString);
      const containerClient = serviceClient.getContainerClient(containerName);
      await containerClient.createIfNotExists();
      await containerClient.setAccessPolicy(undefined);

      return {
        containerClient,
        credential: new StorageSharedKeyCredential(connectionParts.accountname, connectionParts.accountkey),
      };
    })().catch((error) => {
      storageConfigurationPromise = undefined;
      throw error;
    });
  }

  return storageConfigurationPromise;
}

export function isValidBlobName(blobName) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(?:jpg|png|webp)$/i.test(blobName);
}

export async function wasUploadedBy(blobName, userId) {
  if (!isValidBlobName(blobName)) return false;
  const { containerClient } = await getBlobStorage();
  const blobClient = containerClient.getBlobClient(blobName);
  try {
    const properties = await blobClient.getProperties();
    return properties.metadata?.owneruid === userId;
  } catch (error) {
    if (error.statusCode === 404) return false;
    throw new Error('Unable to verify uploaded image ownership.');
  }
}

export async function createReadSasUrl(blobName) {
  if (!isValidBlobName(blobName)) {
    const error = new Error('Invalid image reference.');
    error.code = 'INVALID_BLOB_NAME';
    throw error;
  }

  const { containerClient, credential } = await getBlobStorage();
  const startsOn = new Date(Date.now() - 5 * 60 * 1000);
  const expiresOn = new Date(Date.now() + 15 * 60 * 1000);
  const sas = generateBlobSASQueryParameters({
    containerName: containerClient.containerName,
    blobName,
    permissions: BlobSASPermissions.parse('r'),
    startsOn,
    expiresOn,
    protocol: SASProtocol.Https,
  }, credential).toString();

  return `${containerClient.getBlobClient(blobName).url}?${sas}`;
}
