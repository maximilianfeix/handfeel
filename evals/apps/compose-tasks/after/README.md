# Daylight

A local-first Android task manager built with Kotlin, Jetpack Compose, and Material 3.

- Today with a weekly date strip, completion progress, and category/status filters.
- Upcoming and all-task views, plus title and notes search.
- Create and edit tasks with dates, optional times, priority, notes, and checklists.
- Task details with completion, checklist updates, and confirmed deletion.
- Appearance follows the system (optional Light or Dark override), completed-task visibility, and priority sorting.
- Tasks and preferences persist in private SharedPreferences; no account or network permission.

Open the project in Android Studio with JDK 17, Android SDK 35, and Gradle 8.11.1.
Gradle was intentionally not run. A Gradle wrapper binary is not included.
The sample tasks are created on first launch and use the current date.
Times are planning metadata; the app does not schedule notifications.

Setup references: https://developer.android.com/develop/ui/compose/setup-compose-dependencies-and-compiler
and https://developer.android.com/build/releases/agp-8-9-0-release-notes.
