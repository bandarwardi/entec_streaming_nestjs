# Backend AI Agent Rules (`c:\streaming-nest`)

When modifying backend endpoints or schemas in this workspace:

1. **Server Clock Authority**:
   Never use client-sent timestamps for expiration logic. Always use `new Date()` generated on the server.
2. **MongoDB Schemas**:
   Keep `Device` and `Customer` synchronization robust. Remember that custom playlists live in `Device.customPlaylists`, and user accounts live in `Customer`.
3. **Deployment**:
   This repository deploys to Railway upon pushing to `origin/main`. Always run `npx tsc --noEmit` to verify type safety before pushing.
