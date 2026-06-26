# File Sharing System - Issues

## Medium

**Issue no:** 201
**Issue name:** Add "Copy to Clipboard" button for share links
**Issue description:** Enhance UX by allowing users to easily copy generated share links with a single click instead of manually highlighting text. Show a "Copied!" toast notification.

**Issue no:** 202
**Issue name:** Implement file sorting options
**Issue description:** Allow users to sort the file list by date uploaded, file size, and alphabetical name (ascending and descending).

**Issue no:** 203
**Issue name:** Display upload percentage
**Issue description:** Update the current upload progress UI to include a numeric percentage (e.g., "45%") alongside the visual progress bar.

**Issue no:** 204
**Issue name:** Implement a dark mode toggle
**Issue description:** Add a toggle switch in the navbar to switch between light and dark themes using Tailwind CSS's dark mode classes.

**Issue no:** 205
**Issue name:** Create an empty state UI
**Issue description:** Design and implement a visually appealing "empty state" screen for when a user has no uploaded files or no files shared with them.

**Issue no:** 206
**Issue name:** Basic file search functionality
**Issue description:** Add a search bar to the dashboard that filters the displayed file list by checking if the filename contains the search query.

**Issue no:** 207
**Issue name:** Tooltips for action buttons
**Issue description:** Add hover tooltips to icon buttons (like delete, share, and download) to improve accessibility and user understanding.

**Issue no:** 208
**Issue name:** "Select All" checkbox
**Issue description:** Implement a checkbox in the file list header that selects or deselects all currently visible files for bulk operations.

**Issue no:** 209
**Issue name:** Delete confirmation modal
**Issue description:** Prevent accidental deletions by showing a modal dialog asking "Are you sure you want to delete this file?" before calling the API.

**Issue no:** 210
**Issue name:** Human-readable file sizes
**Issue description:** Create a utility function to format raw byte sizes into human-readable formats (KB, MB, GB) across the entire frontend application.

## Intermediate

**Issue no:** 211
**Issue name:** File list pagination
**Issue description:** Implement pagination on the backend and frontend to handle users with large numbers of files without degrading performance.

**Issue no:** 212
**Issue name:** Basic folder structure
**Issue description:** Allow users to create virtual "folders" and organize their files into these folders for better structure.

**Issue no:** 213
**Issue name:** Multi-file ZIP download
**Issue description:** Implement a backend endpoint that streams multiple selected files into a single downloaded `.zip` archive.

**Issue no:** 214
**Issue name:** Email notifications for shared files
**Issue description:** Integrate an email service (like SendGrid or Nodemailer) to email users when someone shares a file with them.

**Issue no:** 215
**Issue name:** Rate limiting for public downloads
**Issue description:** Add Redis-based rate limiting to public download routes to prevent abuse and bandwidth exhaustion.

**Issue no:** 216
**Issue name:** User profile settings page
**Issue description:** Create a settings page where users can update their display name, email, and change their password.

**Issue no:** 217
**Issue name:** Redis caching for dashboard stats
**Issue description:** Cache expensive database queries (like total storage used and file counts) in Redis to speed up dashboard loading times.

**Issue no:** 218
**Issue name:** Password-protected share links
**Issue description:** Add an option for users to set a custom password when generating a share link. The recipient must enter it to download the file.

**Issue no:** 219
**Issue name:** Auto-logout on inactivity
**Issue description:** Implement a security feature that automatically logs out users if there is no mouse or keyboard activity for 30 minutes.

**Issue no:** 220
**Issue name:** Keyboard shortcuts for actions
**Issue description:** Add global keyboard listeners (e.g., pressing 'Delete' to remove a selected file, 'Esc' to close modals) to improve power-user workflow.

## Hard

**Issue no:** 221
**Issue name:** Real-time sharing notifications
**Issue description:** Use Socket.io to push a live notification to a user's client the moment another user shares a file with them, updating the UI instantly.

**Issue no:** 222
**Issue name:** File versioning system
**Issue description:** Allow users to upload a new version of an existing file. Keep a history of old versions that can be restored or downloaded.

**Issue no:** 223
**Issue name:** Role-Based Access Control (RBAC)
**Issue description:** Introduce roles (e.g., Admin, Regular User) where Admins have elevated privileges to view system-wide stats or moderate content.

**Issue no:** 224
**Issue name:** OAuth2 Social Login
**Issue description:** Integrate Passport.js or a similar library to allow users to sign up and log in using their Google or GitHub accounts.

**Issue no:** 225
**Issue name:** Self-destructing "Burn" links
**Issue description:** Add a new share link type that automatically deletes the file and the link permanently after the file has been downloaded exactly once.

**Issue no:** 226
**Issue name:** Advanced search with filters
**Issue description:** Upgrade the search system to allow filtering by file type (image, video, document), date ranges, and minimum/maximum file size.

**Issue no:** 227
**Issue name:** File renaming functionality
**Issue description:** Allow users to rename their uploaded files directly from the dashboard without needing to download and re-upload them.

**Issue no:** 228
**Issue name:** Image compression on upload
**Issue description:** Process uploaded images on the server to generate compressed, optimized versions (e.g., converting to WebP) to save cloud storage.

**Issue no:** 229
**Issue name:** User avatars / Profile pictures
**Issue description:** Allow users to upload a profile picture. Display this avatar in the navbar and next to their name in shared file lists.

**Issue no:** 230
**Issue name:** Internationalization (i18n)
**Issue description:** Set up `react-i18next` on the client and translate the UI into at least two other languages, adding a language switcher.

## Advanced

**Issue no:** 231
**Issue name:** Desktop client wrapper
**Issue description:** Use Electron or Tauri to wrap the existing web application into a standalone, installable desktop application for Windows/Mac/Linux.

**Issue no:** 232
**Issue name:** P2P file transfer (WebRTC)
**Issue description:** Implement a feature allowing users to send files directly to another online user peer-to-peer, bypassing the server completely.

**Issue no:** 233
**Issue name:** File deduplication engine
**Issue description:** Modify the backend upload logic to hash file contents. If a file already exists on Cloudinary/Disk, link to the existing file instead of re-uploading, saving space.

**Issue no:** 234
**Issue name:** Optical Character Recognition (OCR)
**Issue description:** Integrate an OCR library (like Tesseract.js) to extract text from uploaded images/PDFs and make that text searchable in the dashboard.

**Issue no:** 235
**Issue name:** Kubernetes deployment manifests
**Issue description:** Create Helm charts or Kubernetes YAML manifests to allow the entire stack (Client, Server, Mongo, Redis) to be deployed seamlessly to a K8s cluster.

**Issue no:** 236
**Issue name:** Customizable webhook system
**Issue description:** Allow power users to register webhook URLs that the backend will call with a JSON payload whenever a specific event occurs (e.g., file uploaded, file deleted).

**Issue no:** 237
**Issue name:** Automated S3 database backups
**Issue description:** Write a cron job that creates a MongoDB database dump and uploads it securely to an Amazon S3 bucket on a daily schedule.

**Issue no:** 238
**Issue name:** Progressive Web App (PWA) Offline Mode
**Issue description:** Implement Service Workers and IndexedDB to allow the frontend to load and display cached file metadata even when the user loses internet connection.

**Issue no:** 239
**Issue name:** AI-based automatic file tagging
**Issue description:** Integrate a machine learning API (like Google Vision or an open-source model) to automatically assign descriptive tags to uploaded images.

**Issue no:** 240
**Issue name:** Sophisticated analytics engine
**Issue description:** Build a specialized tracking system to log anonymous usage events (e.g., time spent on page, feature usage frequency) and present them in an admin dashboard.
