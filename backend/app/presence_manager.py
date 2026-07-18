import json
from app.redis_client import redis_client

PRESENCE_TTL_SECONDS = 10


class PresenceManager:
    def _key(self, document_id: str, client_id: str) -> str:
        return f"presence:{document_id}:{client_id}"

    def _set_key(self, document_id: str) -> str:
        return f"presence_set:{document_id}"

    async def upsert(self, document_id: str, client_id: str, data: dict):
        await redis_client.set(self._key(document_id, client_id), json.dumps(data), ex=PRESENCE_TTL_SECONDS)
        await redis_client.sadd(self._set_key(document_id), client_id)

    async def remove(self, document_id: str, client_id: str):
        await redis_client.delete(self._key(document_id, client_id))
        await redis_client.srem(self._set_key(document_id), client_id)

    async def get_all(self, document_id: str) -> list[dict]:
        client_ids = await redis_client.smembers(self._set_key(document_id))
        results, stale = [], []
        for cid in client_ids:
            raw = await redis_client.get(self._key(document_id, cid))
            if raw:
                results.append(json.loads(raw))
            else:
                stale.append(cid)
        if stale:
            await redis_client.srem(self._set_key(document_id), *stale)
        return results


presence_manager = PresenceManager()