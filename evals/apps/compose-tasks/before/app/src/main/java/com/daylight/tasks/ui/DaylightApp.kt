@file:OptIn(androidx.compose.material3.ExperimentalMaterial3Api::class)

package com.daylight.tasks.ui

import android.app.DatePickerDialog
import android.app.TimePickerDialog
import androidx.activity.compose.BackHandler
import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.ArrowBack
import androidx.compose.material.icons.automirrored.outlined.ArrowForward
import androidx.compose.material.icons.automirrored.outlined.Notes
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.semantics.*
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.daylight.tasks.data.*
import com.daylight.tasks.ui.theme.Forest
import com.daylight.tasks.ui.theme.Lime
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.time.format.TextStyle
import java.util.Locale

private val CardShape = RoundedCornerShape(24.dp)
private val DateFormat = DateTimeFormatter.ofPattern("EEEE, MMMM d", Locale.getDefault())
private enum class Destination(val label: String, val icon: ImageVector) {
    Today("Today", Icons.Outlined.WbSunny),
    Upcoming("Upcoming", Icons.Outlined.CalendarMonth),
    All("All tasks", Icons.Outlined.GridView),
    Settings("Settings", Icons.Outlined.Settings),
}

@Composable
fun DaylightApp(store: TaskStore) {
    var destination by rememberSaveable { mutableStateOf(Destination.Today) }
    var screen by rememberSaveable { mutableStateOf("home") }
    var selectedId by rememberSaveable { mutableStateOf<String?>(null) }
    var editId by rememberSaveable { mutableStateOf<String?>(null) }
    var editorReturn by rememberSaveable { mutableStateOf("home") }
    val task = store.tasks.firstOrNull { it.id == selectedId }
    fun back() { screen = if (screen == "editor") editorReturn else "home" }
    BackHandler(screen != "home") { back() }

    Surface(color = MaterialTheme.colorScheme.background) {
        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.TopCenter) {
            Scaffold(
                modifier = Modifier.widthIn(max = 760.dp).fillMaxSize(),
                containerColor = MaterialTheme.colorScheme.background,
                bottomBar = {
                    if (screen == "home") {
                        Surface(color = MaterialTheme.colorScheme.surface) {
                            Column {
                                HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
                                NavigationBar(containerColor = Color.Transparent, tonalElevation = 0.dp) {
                                    Destination.entries.forEach { item ->
                                        NavigationBarItem(
                                            selected = destination == item,
                                            onClick = { destination = item },
                                            icon = { Icon(item.icon, null, Modifier.size(23.dp)) },
                                            label = { Text(item.label, fontSize = 11.sp) },
                                            colors = NavigationBarItemDefaults.colors(indicatorColor = MaterialTheme.colorScheme.primaryContainer),
                                        )
                                    }
                                }
                            }
                        }
                    }
                },
                floatingActionButton = {
                    if (screen == "home" && destination != Destination.Settings) {
                        ExtendedFloatingActionButton(
                            onClick = { editId = null; editorReturn = "home"; screen = "editor" },
                            containerColor = MaterialTheme.colorScheme.primary,
                            contentColor = MaterialTheme.colorScheme.onPrimary,
                            shape = RoundedCornerShape(20.dp),
                            icon = { Icon(Icons.Outlined.Add, null) }, text = { Text("New task") },
                        )
                    }
                },
            ) { padding ->
                AnimatedContent(targetState = screen, label = "screen", modifier = Modifier.padding(padding)) { current ->
                    when (current) {
                        "editor" -> TaskEditor(
                            existing = store.tasks.firstOrNull { it.id == editId },
                            onBack = { back() },
                            onSave = { store.save(it); screen = editorReturn },
                        )
                        "detail" -> if (task != null) TaskDetail(
                            task, onBack = { screen = "home" }, onToggle = { store.toggle(task) },
                            onEdit = { editId = task.id; editorReturn = "detail"; screen = "editor" },
                            onDelete = { store.delete(task.id); screen = "home" },
                            onChecklist = { index ->
                                store.save(task.copy(checklist = task.checklist.mapIndexed { i, item ->
                                    if (i == index) item.copy(done = !item.done) else item
                                }))
                            },
                        ) else MissingTask { screen = "home" }
                        else -> if (destination == Destination.Settings) SettingsScreen(store) else TaskListScreen(
                            store = store, destination = destination,
                            onOpen = { selectedId = it.id; screen = "detail" },
                            onNew = { editId = null; editorReturn = "home"; screen = "editor" },
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun TaskListScreen(store: TaskStore, destination: Destination, onOpen: (Task) -> Unit, onNew: () -> Unit) {
    val today = LocalDate.now()
    var dayEpoch by rememberSaveable { mutableLongStateOf(today.toEpochDay()) }
    val selectedDay = LocalDate.ofEpochDay(dayEpoch)
    var category by rememberSaveable { mutableStateOf("All") }
    var query by rememberSaveable { mutableStateOf("") }
    var searching by rememberSaveable { mutableStateOf(false) }
    var status by rememberSaveable { mutableStateOf("All") }
    val inScope = store.tasks.filter {
        when (destination) {
            Destination.Today -> it.date == selectedDay
            Destination.Upcoming -> it.date > today
            else -> true
        }
    }
    val visible = inScope.filter {
        (category == "All" || it.category.name == category) &&
            (query.isBlank() || it.title.contains(query, true) || it.notes.contains(query, true)) &&
            (store.showCompleted || !it.done) &&
            (status == "All" || (status == "Completed") == it.done)
    }.sortedWith(compareBy<Task> { it.done }
        .thenBy { if (store.sortByPriority) -it.priority.ordinal else 0 }
        .thenBy { it.date }.thenBy { it.time.ifBlank { "99:99" } })
    val complete = inScope.count { it.done }
    val pending = visible.filterNot { it.done }
    val completed = visible.filter { it.done }

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(start = 24.dp, end = 24.dp, top = 16.dp, bottom = 104.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        item {
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                Row(Modifier.weight(1f), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Icon(Icons.Outlined.WbSunny, null, Modifier.size(25.dp), tint = MaterialTheme.colorScheme.primary)
                    Text("daylight", style = MaterialTheme.typography.titleLarge, letterSpacing = (-0.8).sp)
                }
                IconButton(onClick = { searching = !searching; if (!searching) query = "" }) {
                    Icon(if (searching) Icons.Outlined.Close else Icons.Outlined.Search, if (searching) "Close search" else "Search tasks")
                }
                Box(Modifier.size(40.dp).background(MaterialTheme.colorScheme.primaryContainer, CircleShape), contentAlignment = Alignment.Center) {
                    Icon(Icons.Outlined.PersonOutline, "Your workspace", tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(22.dp))
                }
            }
        }
        item {
            Column(Modifier.padding(top = 12.dp, bottom = 8.dp)) {
                Text(today.format(DateFormat), style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                Spacer(Modifier.height(7.dp))
                Text(when (destination) { Destination.Today -> "Make room for today."; Destination.Upcoming -> "A little planning ahead."; else -> "Everything, in one place." }, style = MaterialTheme.typography.displaySmall)
                Spacer(Modifier.height(8.dp))
                Text(when (destination) { Destination.Today -> "A clear mind starts with a little plan."; Destination.Upcoming -> "Good things begin with a small next step."; else -> "Your ideas, plans, and everyday little wins." }, color = MaterialTheme.colorScheme.onSurfaceVariant, style = MaterialTheme.typography.bodyMedium)
            }
        }
        if (destination == Destination.Today) {
            item { WeekStrip(selectedDay) { dayEpoch = it.toEpochDay() } }
            item { ProgressCard(complete, inScope.size) }
        }
        if (searching) item {
            OutlinedTextField(query, { query = it }, Modifier.fillMaxWidth(), singleLine = true,
                label = { Text("Search tasks") }, leadingIcon = { Icon(Icons.Outlined.Search, null) }, shape = RoundedCornerShape(16.dp))
        }
        item {
            Row(Modifier.padding(top = 8.dp).fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                Text(if (destination == Destination.Today && selectedDay == today) "Today's tasks" else if (destination == Destination.Today) selectedDay.format(DateTimeFormatter.ofPattern("MMMM d")) else destination.label,
                    style = MaterialTheme.typography.titleLarge, modifier = Modifier.weight(1f))
                var expanded by remember { mutableStateOf(false) }
                Box {
                    IconButton(onClick = { expanded = true }) { Icon(Icons.Outlined.Tune, "Filter task status") }
                    DropdownMenu(expanded, { expanded = false }) {
                        listOf("All", "Active", "Completed").forEach { option ->
                            DropdownMenuItem(text = { Text(if (status == option) "✓  $option" else option) }, onClick = { status = option; expanded = false })
                        }
                    }
                }
            }
        }
        item {
            Row(Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                (listOf("All") + Category.entries.map { it.name }).forEach { name ->
                    FilterChip(selected = category == name, onClick = { category = name }, label = { Text(name) },
                        leadingIcon = if (name != "All") ({ Box(Modifier.size(7.dp).background(categoryColor(Category.valueOf(name)), CircleShape)) }) else null,
                        shape = RoundedCornerShape(12.dp),
                        colors = FilterChipDefaults.filterChipColors(selectedContainerColor = MaterialTheme.colorScheme.primary, selectedLabelColor = MaterialTheme.colorScheme.onPrimary),
                        border = FilterChipDefaults.filterChipBorder(enabled = true, selected = category == name, borderColor = MaterialTheme.colorScheme.outlineVariant))
                }
            }
        }
        if (status != "All") item {
            Text("Showing ${status.lowercase()} tasks", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.primary)
        }
        if (visible.isEmpty()) item {
            EmptyState(if (query.isNotBlank()) "No matching tasks" else "A little breathing room", if (query.isNotBlank()) "Try another word or change your filters." else "Nothing here yet. Add something you want to make time for.", onNew)
        }
        if (pending.isNotEmpty()) item { SectionLabel("To do", pending.size) }
        items(pending, key = { it.id }) { task -> TaskCard(task, destination != Destination.Today, { onOpen(task) }, { store.toggle(task) }) }
        if (completed.isNotEmpty()) item { SectionLabel("Completed", completed.size) }
        items(completed, key = { it.id }) { task -> TaskCard(task, destination != Destination.Today, { onOpen(task) }, { store.toggle(task) }) }
        if (visible.isNotEmpty()) item {
            Row(Modifier.fillMaxWidth().padding(top = 16.dp), horizontalArrangement = Arrangement.Center, verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Outlined.Spa, null, Modifier.size(15.dp), tint = MaterialTheme.colorScheme.onSurfaceVariant)
                Spacer(Modifier.width(7.dp))
                Text("One thing at a time is enough.", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
    }
}

@Composable
private fun WeekStrip(selected: LocalDate, onSelect: (LocalDate) -> Unit) {
    val today = LocalDate.now()
    val start = today.minusDays((today.dayOfWeek.value - 1).toLong())
    Row(Modifier.fillMaxWidth().padding(vertical = 8.dp), horizontalArrangement = Arrangement.spacedBy(5.dp)) {
        repeat(7) { offset ->
            val day = start.plusDays(offset.toLong())
            val active = day == selected
            val color by animateColorAsState(if (active) MaterialTheme.colorScheme.primary else Color.Transparent, label = "day selection")
            val foreground = if (active) MaterialTheme.colorScheme.onPrimary else MaterialTheme.colorScheme.onSurface
            Column(
                Modifier.weight(1f).clip(RoundedCornerShape(18.dp)).background(color)
                    .clickable { onSelect(day) }.semantics { contentDescription = day.format(DateFormat); this.selected = active }
                    .padding(vertical = 12.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Text(day.dayOfWeek.getDisplayName(TextStyle.SHORT, Locale.getDefault()).take(2), fontSize = 11.sp, color = if (active) foreground.copy(alpha = .75f) else MaterialTheme.colorScheme.onSurfaceVariant)
                Spacer(Modifier.height(7.dp))
                Text(day.dayOfMonth.toString(), color = foreground, fontWeight = FontWeight.SemiBold, fontSize = 18.sp)
                Spacer(Modifier.height(7.dp))
                Box(Modifier.size(4.dp).background(if (day == today) foreground else Color.Transparent, CircleShape))
            }
        }
    }
}

@Composable
private fun ProgressCard(completed: Int, total: Int) {
    val progress by animateFloatAsState(if (total == 0) 0f else completed.toFloat() / total, label = "daily progress")
    Surface(shape = CardShape, color = MaterialTheme.colorScheme.primaryContainer) {
        Row(Modifier.fillMaxWidth().padding(22.dp), verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text(if (total > 0 && completed == total) "Look at you go." else "Little steps. Big things.", style = MaterialTheme.typography.titleMedium)
                Spacer(Modifier.height(5.dp))
                Text(if (total == 0) "A fresh page for your day." else "$completed of $total tasks completed", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = .75f))
                Spacer(Modifier.height(15.dp))
                LinearProgressIndicator(progress = { progress }, Modifier.width(150.dp).height(5.dp).clip(CircleShape), color = MaterialTheme.colorScheme.primary, trackColor = MaterialTheme.colorScheme.primary.copy(alpha = .12f), drawStopIndicator = {})
            }
            val ink = MaterialTheme.colorScheme.primary
            Box(Modifier.size(72.dp), contentAlignment = Alignment.Center) {
                Canvas(Modifier.fillMaxSize()) {
                    val c = center
                    val radius = size.minDimension * .27f
                    drawCircle(ink.copy(alpha = .12f), radius * 1.5f)
                    drawCircle(ink, radius, style = Stroke(2.dp.toPx()))
                    for (i in 0..7) {
                        val angle = Math.PI * i / 4
                        fun point(r: Float) = Offset(c.x + kotlin.math.cos(angle).toFloat() * r, c.y + kotlin.math.sin(angle).toFloat() * r)
                        drawLine(ink, point(radius * 1.3f), point(radius * 1.55f), 2.dp.toPx(), StrokeCap.Round)
                    }
                }
                Icon(Icons.Outlined.Check, null, Modifier.size(22.dp), tint = ink)
            }
        }
    }
}

@Composable
private fun SectionLabel(title: String, count: Int) {
    Row(Modifier.padding(top = 6.dp, bottom = 2.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        Text(title, style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Text(count.toString(), style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.background(MaterialTheme.colorScheme.surfaceVariant, CircleShape).padding(horizontal = 7.dp, vertical = 1.dp))
    }
}

@Composable
private fun TaskCard(task: Task, showDate: Boolean, onClick: () -> Unit, onToggle: () -> Unit) {
    Surface(onClick = onClick, shape = RoundedCornerShape(20.dp), color = MaterialTheme.colorScheme.surface,
        border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)) {
        Row(Modifier.fillMaxWidth().padding(start = 5.dp, end = 16.dp, top = 15.dp, bottom = 15.dp), verticalAlignment = Alignment.Top) {
            Checkbox(checked = task.done, onCheckedChange = { onToggle() },
                modifier = Modifier.semantics { contentDescription = if (task.done) "Mark ${task.title} incomplete" else "Complete ${task.title}" },
                colors = CheckboxDefaults.colors(checkedColor = MaterialTheme.colorScheme.primary, uncheckedColor = MaterialTheme.colorScheme.outline))
            Column(Modifier.weight(1f).padding(top = 2.dp)) {
                Text(task.title, style = MaterialTheme.typography.titleMedium, color = if (task.done) MaterialTheme.colorScheme.onSurfaceVariant else MaterialTheme.colorScheme.onSurface,
                    textDecoration = if (task.done) TextDecoration.LineThrough else TextDecoration.None, maxLines = 2, overflow = TextOverflow.Ellipsis)
                Spacer(Modifier.height(10.dp))
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    CategoryBadge(task.category)
                    if (task.time.isNotBlank() || showDate) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                            Icon(Icons.Outlined.Schedule, null, Modifier.size(12.dp), tint = MaterialTheme.colorScheme.onSurfaceVariant)
                            Text(if (showDate) task.date.format(DateTimeFormatter.ofPattern("MMM d")) else task.time,
                                style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                    }
                    if (task.checklist.isNotEmpty()) Text("${task.checklist.count { it.done }}/${task.checklist.size}", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
            if (task.priority == Priority.High && !task.done) Icon(Icons.Outlined.Flag, "High priority", Modifier.padding(top = 5.dp).size(17.dp), tint = Color(0xFFAD5D3E))
        }
    }
}

private fun categoryColor(category: Category): Color = when (category) {
    Category.Work -> Color(0xFF637DAD)
    Category.Personal -> Color(0xFFAD7353)
    Category.Wellness -> Color(0xFF5C8260)
}

@Composable
private fun CategoryBadge(category: Category) {
    val color = categoryColor(category)
    Row(Modifier.background(color.copy(alpha = .12f), RoundedCornerShape(6.dp)).padding(horizontal = 7.dp, vertical = 3.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(5.dp)) {
        Box(Modifier.size(5.dp).background(color, CircleShape))
        Text(category.name, style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurface)
    }
}

@Composable
private fun EmptyState(title: String, description: String, onNew: () -> Unit) {
    Column(Modifier.fillMaxWidth().padding(vertical = 32.dp), horizontalAlignment = Alignment.CenterHorizontally) {
        Icon(Icons.Outlined.CheckCircleOutline, null, Modifier.size(40.dp), tint = MaterialTheme.colorScheme.primary)
        Spacer(Modifier.height(16.dp)); Text(title, style = MaterialTheme.typography.titleLarge)
        Spacer(Modifier.height(8.dp)); Text(description, color = MaterialTheme.colorScheme.onSurfaceVariant, style = MaterialTheme.typography.bodyMedium, textAlign = androidx.compose.ui.text.style.TextAlign.Center)
        TextButton(onClick = onNew) { Text("Create a task") }
    }
}

@Composable
private fun PageHeader(title: String, onBack: () -> Unit, action: @Composable RowScope.() -> Unit = {}) {
    Row(Modifier.fillMaxWidth().padding(start = 12.dp, end = 16.dp, top = 8.dp, bottom = 12.dp), verticalAlignment = Alignment.CenterVertically) {
        IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Outlined.ArrowBack, "Go back") }
        Text(title, style = MaterialTheme.typography.titleMedium, modifier = Modifier.weight(1f).padding(start = 8.dp))
        action()
    }
}

@Composable
private fun TaskEditor(existing: Task?, onBack: () -> Unit, onSave: (Task) -> Unit) {
    var title by rememberSaveable(existing?.id) { mutableStateOf(existing?.title ?: "") }
    var notes by rememberSaveable(existing?.id) { mutableStateOf(existing?.notes ?: "") }
    var category by rememberSaveable(existing?.id) { mutableStateOf(existing?.category ?: Category.Work) }
    var priority by rememberSaveable(existing?.id) { mutableStateOf(existing?.priority ?: Priority.Medium) }
    var epoch by rememberSaveable(existing?.id) { mutableLongStateOf((existing?.date ?: LocalDate.now()).toEpochDay()) }
    var time by rememberSaveable(existing?.id) { mutableStateOf(existing?.time ?: "") }
    var checklist by rememberSaveable(existing?.id) { mutableStateOf(existing?.checklist?.joinToString("\n") { it.title } ?: "") }
    var attempted by rememberSaveable { mutableStateOf(false) }
    var discard by remember { mutableStateOf(false) }
    val date = LocalDate.ofEpochDay(epoch)
    val context = LocalContext.current
    val dirty = title != (existing?.title ?: "") || notes != (existing?.notes ?: "") ||
        category != (existing?.category ?: Category.Work) || priority != (existing?.priority ?: Priority.Medium) ||
        date != (existing?.date ?: LocalDate.now()) || time != (existing?.time ?: "") ||
        checklist != (existing?.checklist?.joinToString("\n") { it.title } ?: "")
    fun leave() { if (dirty) discard = true else onBack() }
    BackHandler { leave() }
    if (discard) AlertDialog(
        onDismissRequest = { discard = false }, title = { Text("Discard your changes?") },
        text = { Text("Your unsaved changes will be lost.") },
        confirmButton = { TextButton(onClick = onBack) { Text("Discard") } },
        dismissButton = { TextButton(onClick = { discard = false }) { Text("Keep editing") } },
    )
    Column(Modifier.fillMaxSize().imePadding()) {
        PageHeader(if (existing == null) "New task" else "Edit task", { leave() }) {
            Text("${title.length}/120", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        Column(Modifier.weight(1f).verticalScroll(rememberScrollState()).padding(horizontal = 24.dp), verticalArrangement = Arrangement.spacedBy(20.dp)) {
            Column {
                Text(if (existing == null) "Make a little plan." else "A fresh perspective.", style = MaterialTheme.typography.headlineLarge)
                Spacer(Modifier.height(8.dp))
                Text("Give your next step a place to begin.", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            OutlinedTextField(title, { if (it.length <= 120) title = it }, Modifier.fillMaxWidth(),
                label = { Text("What would you like to do?") }, placeholder = { Text("e.g. Explore a new idea") },
                isError = attempted && title.isBlank(), supportingText = if (attempted && title.isBlank()) ({ Text("Give your task a title.") }) else null,
                shape = RoundedCornerShape(16.dp), maxLines = 3)
            OutlinedTextField(notes, { notes = it }, Modifier.fillMaxWidth(), label = { Text("Notes") },
                placeholder = { Text("A few details, a thought, a starting point…") }, minLines = 3, maxLines = 6,
                shape = RoundedCornerShape(16.dp))
            Column {
                FormLabel("Category")
                Row(Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Category.entries.forEach { item ->
                        FilterChip(category == item, { category = item }, label = { Text(item.name) },
                            leadingIcon = { Box(Modifier.size(7.dp).background(categoryColor(item), CircleShape)) })
                    }
                }
            }
            Column {
                FormLabel("Schedule")
                Surface(shape = RoundedCornerShape(18.dp), color = MaterialTheme.colorScheme.surface) {
                    Column {
                        DetailRow(Icons.Outlined.CalendarToday, "Due date", date.format(DateTimeFormatter.ofPattern("EEE, MMM d, yyyy"))) {
                            DatePickerDialog(context, { _, year, month, day -> epoch = LocalDate.of(year, month + 1, day).toEpochDay() }, date.year, date.monthValue - 1, date.dayOfMonth).show()
                        }
                        HorizontalDivider(Modifier.padding(horizontal = 18.dp), color = MaterialTheme.colorScheme.outlineVariant)
                        DetailRow(Icons.Outlined.Schedule, "Time", time.ifBlank { "Add a time" }) {
                            val parts = time.split(":")
                            TimePickerDialog(context, { _, hour, minute -> time = String.format(Locale.ROOT, "%02d:%02d", hour, minute) }, parts.getOrNull(0)?.toIntOrNull() ?: 9, parts.getOrNull(1)?.toIntOrNull() ?: 0, true).show()
                        }
                    }
                }
                if (time.isNotBlank()) TextButton(onClick = { time = "" }) { Text("Remove time") }
            }
            Column {
                FormLabel("Priority")
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Priority.entries.forEach { item ->
                        FilterChip(priority == item, { priority = item }, label = { Text(item.name) },
                            leadingIcon = { Icon(Icons.Outlined.Flag, null, Modifier.size(15.dp)) })
                    }
                }
            }
            OutlinedTextField(checklist, { checklist = it }, Modifier.fillMaxWidth(), label = { Text("Small steps (optional)") },
                placeholder = { Text("One step on each line") }, supportingText = { Text("Break a bigger task into a few smaller steps.") },
                minLines = 2, shape = RoundedCornerShape(16.dp))
            Spacer(Modifier.height(4.dp))
        }
        Surface(color = MaterialTheme.colorScheme.background) {
            Button(onClick = {
                attempted = true
                if (title.isNotBlank()) {
                    val steps = checklist.lines().map { it.trim() }.filter { it.isNotBlank() }.map { text ->
                        ChecklistItem(text, existing?.checklist?.firstOrNull { it.title == text }?.done ?: false)
                    }
                    onSave((existing ?: Task(title = title.trim())).copy(title = title.trim(), notes = notes.trim(), category = category, priority = priority, date = date, time = time, checklist = steps))
                }
            }, modifier = Modifier.padding(24.dp).fillMaxWidth().height(56.dp), shape = RoundedCornerShape(18.dp)) {
                Icon(Icons.Outlined.Check, null, Modifier.size(20.dp)); Spacer(Modifier.width(8.dp))
                Text(if (existing == null) "Create task" else "Save changes")
            }
        }
    }
}

@Composable
private fun FormLabel(text: String) {
    Text(text, style = MaterialTheme.typography.labelLarge, modifier = Modifier.padding(bottom = 8.dp))
}

@Composable
private fun DetailRow(icon: ImageVector, label: String, value: String, onClick: (() -> Unit)? = null) {
    Row(Modifier.fillMaxWidth().then(if (onClick != null) Modifier.clickable(onClick = onClick) else Modifier).padding(18.dp), verticalAlignment = Alignment.CenterVertically) {
        Icon(icon, null, Modifier.size(20.dp), tint = MaterialTheme.colorScheme.onSurfaceVariant)
        Spacer(Modifier.width(12.dp))
        Column(Modifier.weight(1f)) {
            Text(label, style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Text(value, style = MaterialTheme.typography.bodyLarge)
        }
        if (onClick != null) Icon(Icons.Outlined.ChevronRight, null, tint = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}

@Composable
private fun TaskDetail(task: Task, onBack: () -> Unit, onToggle: () -> Unit, onEdit: () -> Unit, onDelete: () -> Unit, onChecklist: (Int) -> Unit) {
    var confirmDelete by remember { mutableStateOf(false) }
    if (confirmDelete) AlertDialog(onDismissRequest = { confirmDelete = false },
        title = { Text("Delete this task?") }, text = { Text("“${task.title}” and its checklist will be permanently removed.") },
        confirmButton = { TextButton(onClick = onDelete) { Text("Delete", color = MaterialTheme.colorScheme.error) } },
        dismissButton = { TextButton(onClick = { confirmDelete = false }) { Text("Keep task") } })
    Column(Modifier.fillMaxSize()) {
        PageHeader("Task details", onBack) {
            IconButton(onClick = onEdit) { Icon(Icons.Outlined.Edit, "Edit task") }
            IconButton(onClick = { confirmDelete = true }) { Icon(Icons.Outlined.DeleteOutline, "Delete task") }
        }
        Column(Modifier.weight(1f).verticalScroll(rememberScrollState()).padding(horizontal = 24.dp), verticalArrangement = Arrangement.spacedBy(24.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                CategoryBadge(task.category)
                if (task.done) Text("Completed", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.primary)
            }
            Text(task.title, style = MaterialTheme.typography.displaySmall)
            if (task.notes.isNotBlank()) Text(task.notes, style = MaterialTheme.typography.bodyLarge, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Surface(shape = CardShape, color = MaterialTheme.colorScheme.surface) {
                Column {
                    DetailRow(Icons.Outlined.CalendarToday, "Due date", task.date.format(DateFormat))
                    HorizontalDivider(Modifier.padding(horizontal = 18.dp), color = MaterialTheme.colorScheme.outlineVariant)
                    if (task.time.isNotBlank()) {
                        DetailRow(Icons.Outlined.Schedule, "Time", task.time)
                        HorizontalDivider(Modifier.padding(horizontal = 18.dp), color = MaterialTheme.colorScheme.outlineVariant)
                    }
                    DetailRow(Icons.Outlined.Flag, "Priority", "${task.priority.name} priority")
                }
            }
            if (task.checklist.isNotEmpty()) {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                        Text("One step at a time", style = MaterialTheme.typography.titleLarge, modifier = Modifier.weight(1f))
                        Text("${task.checklist.count { it.done }}/${task.checklist.size}", color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                    task.checklist.forEachIndexed { index, item ->
                        Surface(shape = RoundedCornerShape(14.dp), color = MaterialTheme.colorScheme.surface) {
                            Row(Modifier.fillMaxWidth().clickable(role = Role.Checkbox, onClick = { onChecklist(index) }).semantics { stateDescription = if (item.done) "Completed" else "Incomplete" }.padding(8.dp), verticalAlignment = Alignment.CenterVertically) {
                                Checkbox(item.done, { onChecklist(index) })
                                Text(item.title, modifier = Modifier.weight(1f).padding(end = 8.dp), style = MaterialTheme.typography.bodyLarge,
                                    textDecoration = if (item.done) TextDecoration.LineThrough else TextDecoration.None)
                            }
                        }
                    }
                }
            }
            Spacer(Modifier.height(8.dp))
        }
        Button(onClick = onToggle, Modifier.padding(24.dp).fillMaxWidth().height(56.dp), shape = RoundedCornerShape(18.dp)) {
            Icon(if (task.done) Icons.Outlined.Replay else Icons.Outlined.CheckCircleOutline, null)
            Spacer(Modifier.width(10.dp)); Text(if (task.done) "Mark as incomplete" else "Complete task")
        }
    }
}

@Composable
private fun SettingsScreen(store: TaskStore) {
    var clearDialog by remember { mutableStateOf(false) }
    if (clearDialog) AlertDialog(onDismissRequest = { clearDialog = false },
        title = { Text("Clear completed tasks?") }, text = { Text("This will permanently delete ${store.tasks.count { it.done }} completed tasks. Your active tasks will stay here.") },
        confirmButton = { TextButton(onClick = { store.clearCompleted(); clearDialog = false }) { Text("Clear completed", color = MaterialTheme.colorScheme.error) } },
        dismissButton = { TextButton(onClick = { clearDialog = false }) { Text("Cancel") } })
    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(24.dp), verticalArrangement = Arrangement.spacedBy(24.dp)) {
        Text("Your space.", style = MaterialTheme.typography.displaySmall, modifier = Modifier.padding(top = 16.dp))
        Text("A few little things to make Daylight yours.", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Surface(shape = CardShape, color = MaterialTheme.colorScheme.primaryContainer) {
            Row(Modifier.fillMaxWidth().padding(22.dp), verticalAlignment = Alignment.CenterVertically) {
                Box(Modifier.size(52.dp).background(MaterialTheme.colorScheme.primary, CircleShape), contentAlignment = Alignment.Center) {
                    Icon(Icons.Outlined.WbSunny, null, tint = MaterialTheme.colorScheme.onPrimary)
                }
                Spacer(Modifier.width(16.dp))
                Column {
                    Text("A little more headspace", style = MaterialTheme.typography.titleMedium)
                    Text("Your personal workspace", color = MaterialTheme.colorScheme.onSurfaceVariant, style = MaterialTheme.typography.bodyMedium)
                }
            }
        }
        Column {
            FormLabel("Make yourself at home")
            Surface(shape = CardShape, color = MaterialTheme.colorScheme.surface) {
                Column {
                    SettingToggle(Icons.Outlined.DarkMode, "Dark appearance", "A softer light for late nights", store.darkMode, store::setDark)
                    HorizontalDivider(Modifier.padding(horizontal = 18.dp), color = MaterialTheme.colorScheme.outlineVariant)
                    SettingToggle(Icons.Outlined.TaskAlt, "Show completed tasks", "Keep your little wins in view", store.showCompleted, store::setCompleted)
                    HorizontalDivider(Modifier.padding(horizontal = 18.dp), color = MaterialTheme.colorScheme.outlineVariant)
                    SettingToggle(Icons.Outlined.Flag, "Prioritize what matters", "Sort high-priority tasks first", store.sortByPriority, store::setSorting)
                }
            }
        }
        Column {
            FormLabel("Your tasks")
            Surface(shape = CardShape, color = MaterialTheme.colorScheme.surface) {
                Column {
                    DetailRow(Icons.Outlined.Inventory2, "Saved on this device", "${store.tasks.count { !it.done }} active · ${store.tasks.count { it.done }} completed")
                    HorizontalDivider(Modifier.padding(horizontal = 18.dp), color = MaterialTheme.colorScheme.outlineVariant)
                    TextButton(onClick = { clearDialog = true }, enabled = store.tasks.any { it.done }, modifier = Modifier.padding(8.dp)) {
                        Icon(Icons.Outlined.DeleteSweep, null, Modifier.size(20.dp)); Spacer(Modifier.width(12.dp)); Text("Clear completed tasks")
                    }
                }
            }
        }
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            Icon(Icons.Outlined.Lock, null, Modifier.size(18.dp), tint = MaterialTheme.colorScheme.onSurfaceVariant)
            Text("A quiet space, just for you. Your tasks are stored locally on this device. No account needed.", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        Column(Modifier.fillMaxWidth().padding(vertical = 16.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            Text("daylight", style = MaterialTheme.typography.titleLarge, color = MaterialTheme.colorScheme.primary)
            Spacer(Modifier.height(4.dp)); Text("A little less busy. A little more you.", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Spacer(Modifier.height(8.dp)); Text("Version 1.0", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

@Composable
private fun SettingToggle(icon: ImageVector, title: String, subtitle: String, checked: Boolean, onChange: (Boolean) -> Unit) {
    Row(Modifier.fillMaxWidth().padding(horizontal = 18.dp, vertical = 14.dp), verticalAlignment = Alignment.CenterVertically) {
        Icon(icon, null, Modifier.size(22.dp), tint = MaterialTheme.colorScheme.primary)
        Spacer(Modifier.width(14.dp))
        Column(Modifier.weight(1f)) {
            Text(title, style = MaterialTheme.typography.titleMedium)
            Text(subtitle, style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        Spacer(Modifier.width(8.dp))
        Switch(checked, onChange, modifier = Modifier.semantics { contentDescription = title })
    }
}

@Composable
private fun MissingTask(onBack: () -> Unit) {
    Column(Modifier.fillMaxSize(), verticalArrangement = Arrangement.Center, horizontalAlignment = Alignment.CenterHorizontally) {
        Text("This task is no longer here.", style = MaterialTheme.typography.titleLarge)
        TextButton(onClick = onBack) { Text("Back to tasks") }
    }
}
