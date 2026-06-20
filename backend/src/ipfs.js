import { create } from "ipfs-http-client";

const apiUrl = process.env.IPFS_API_URL;
const projectId = process.env.IPFS_PROJECT_ID;
const projectSecret = process.env.IPFS_PROJECT_SECRET;

let ipfsClient = null;

if (apiUrl) {
  const authHeader = projectId && projectSecret
    ? {
        authorization: `Basic ${Buffer.from(`${projectId}:${projectSecret}`).toString("base64")}`
      }
    : undefined;

  ipfsClient = create({
    url: apiUrl,
    headers: authHeader
  });
}

export async function uploadJsonToIpfs(payload) {
  if (!ipfsClient) {
    return "";
  }
  const result = await ipfsClient.add(JSON.stringify(payload));
  return result.cid.toString();
}

export async function readJsonFromIpfs(cid) {
  if (!ipfsClient || !cid) {
    return null;
  }

  const chunks = [];
  for await (const chunk of ipfsClient.cat(cid)) {
    chunks.push(chunk);
  }

  const content = Buffer.concat(chunks).toString("utf8");
  return JSON.parse(content);
}
