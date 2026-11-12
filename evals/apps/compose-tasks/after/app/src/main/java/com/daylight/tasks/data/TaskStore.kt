package com.daylight.tasks.data

import android.app.Application
import android.content.Context
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.AndroidViewModel
import org.json.JSONArray
import org.json.JSONObject
import java.time.LocalDate
import java.util.UUID

enum class Category { Work, Personal, Wellness }
enum class Priority { Low, Medium, High }
/** System follows the device setting; Light and Dark are explicit overrides. */
enum class ThemeMode { System, Light, Dark }
data class ChecklistItem(val title: String, val done: Boolean = false)
data class Task(
    val id: String = UUID.randomUUID().toString(),
    val title: String,
    val notes: String = "",
    val category: Category = Category.Work,
    val priority: Priority = Priority.Medium,
    val date: LocalDate = LocalDate.now(),
    val time: String = "",
    val done: Boolean = false,
    val checklist: List<ChecklistItem> = emptyList(),
)

/** One local source of truth. Immutable task updates keep every screen in sync. */
class TaskStore(application: Application) : AndroidViewModel(application) {
    private val preferences = application.getSharedPreferences("daylight", Context.MODE_PRIVATE)
    val tasks = mutableStateListOf<Task>()
    var themeMode by mutableStateOf(readThemeMode())
        private set
    var showCompleted by mutableStateOf(preferences.getBoolean("showCompleted", true))
        private set
    var sortByPriority by mutableStateOf(preferences.getBoolean("sortByPriority", false))
        private set

    init {
        val saved = preferences.getString("tasks", null)
        if (saved == null) {
            tasks.addAll(sampleTasks())
            persist()
        } else {
            // A malformed entry must not prevent the remaining tasks from loading.
            runCatching { JSONArray(saved) }.getOrNull()?.let { array ->
                for (index in 0 until array.length()) {
                    runCatching { decode(array.getJSONObject(index)) }.getOrNull()?.let(tasks::add)
                }
            }
        }
    }

    fun save(task: Task) {
        val index = tasks.indexOfFirst { it.id == task.id }
        if (index == -1) tasks.add(task) else tasks[index] = task
        persist()
    }
    fun toggle(task: Task) = save(task.copy(done = !task.done))
    fun delete(id: String) { tasks.removeAll { it.id == id }; persist() }
    fun clearCompleted() { tasks.removeAll { it.done }; persist() }
    fun setTheme(value: ThemeMode) { themeMode = value; preferences.edit().putString("themeMode", value.name).apply() }
    fun setCompleted(value: Boolean) { showCompleted = value; preferences.edit().putBoolean("showCompleted", value).apply() }
    fun setSorting(value: Boolean) { sortByPriority = value; preferences.edit().putBoolean("sortByPriority", value).apply() }

    // Older installs stored a dark-mode switch; an explicit "on" stays Dark, everything else follows the system.
    private fun readThemeMode(): ThemeMode =
        preferences.getString("themeMode", null)?.let { saved -> ThemeMode.entries.firstOrNull { it.name == saved } }
            ?: if (preferences.getBoolean("darkMode", false)) ThemeMode.Dark else ThemeMode.System

    private fun persist() {
        val array = JSONArray()
        tasks.forEach { task ->
            array.put(JSONObject().apply {
                put("id", task.id); put("title", task.title); put("notes", task.notes)
                put("category", task.category.name); put("priority", task.priority.name)
                put("date", task.date.toString()); put("time", task.time); put("done", task.done)
                put("checklist", JSONArray().apply {
                    task.checklist.forEach { put(JSONObject().put("title", it.title).put("done", it.done)) }
                })
            })
        }
        preferences.edit().putString("tasks", array.toString()).apply()
    }

    private fun decode(json: JSONObject): Task {
        val list = json.optJSONArray("checklist") ?: JSONArray()
        return Task(
            id = json.getString("id"), title = json.getString("title"), notes = json.optString("notes"),
            category = Category.valueOf(json.getString("category")),
            priority = Priority.valueOf(json.getString("priority")), date = LocalDate.parse(json.getString("date")),
            time = json.optString("time"), done = json.optBoolean("done"),
            checklist = (0 until list.length()).map { index ->
                list.getJSONObject(index).let { ChecklistItem(it.getString("title"), it.optBoolean("done")) }
            },
        )
    }
}

private fun sampleTasks(): List<Task> {
    val today = LocalDate.now()
    return listOf(
        Task(title = "Website design exploration", notes = "Explore a calmer, more considered direction for the new website. Gather references and sketch the first few ideas.", priority = Priority.High, time = "09:30", checklist = listOf(ChecklistItem("Collect visual references", true), ChecklistItem("Explore typography & color"), ChecklistItem("Sketch the homepage"))),
        Task(title = "A little time outside", notes = "Take the long route through the park. Leave the headphones at home.", category = Category.Wellness, priority = Priority.Low, time = "12:30"),
        Task(title = "Plan the weekend", notes = "Something good to eat, somewhere new to go.", category = Category.Personal, time = "18:00"),
        Task(title = "Read 10 pages", category = Category.Wellness, priority = Priority.Low, time = "08:00", done = true),
        Task(title = "Make a little room for focus", category = Category.Personal, priority = Priority.Low, done = true),
        Task(title = "Share the first design concepts", date = today.plusDays(1), priority = Priority.High, time = "10:00"),
        Task(title = "Pick up groceries", category = Category.Personal, date = today.plusDays(2), time = "17:30"),
    )
}
