@file:OptIn(androidx.compose.material3.ExperimentalMaterial3Api::class, androidx.compose.foundation.layout.ExperimentalLayoutApi::class)

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
import androidx.compose.foundation.selection.toggleable
import androidx.compose.foundation.text.KeyboardOptions
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
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.semantics.*
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.daylight.tasks.data.*
import com.daylight.tasks.ui.theme.DaylightTheme
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.time.format.TextStyle
import java.util.Locale

private val CardShape = RoundedCornerShape(24.dp)
private val RowShape = RoundedCornerShape(16.dp)
private val ChipShape = RoundedCornerShape(12.dp)
private val BadgeShape = RoundedCornerShape(8.dp)
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
                                            icon = { Icon(item.icon, contentDescription = null) },
                                            label = { Text(item.label) },
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
                            icon = { Icon(Icons.Outlined.Add, null) }, text = { Text("New task") },
                        )
                    }
                },
            ) { padding ->
                // consumeWindowInsets: the editor's imePadding must not add the navigation bar inset a second time.
                AnimatedContent(targetState = screen, label = "screen", modifier = Modifier.padding(padding).consumeWindowInsets(padding)) { current ->
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
                    Icon(Icons.Outlined.WbSunny, null, Modifier.size(24.dp), tint = MaterialTheme.colorScheme.primary)
                    Text("daylight", style = MaterialTheme.typography.titleLarge, letterSpacing = (-0.8).sp)
                }
                IconButton(onClick = { searching = !searching; if (!searching) query = "" }) {
                    Icon(if (searching) Icons.Outlined.Close else Icons.Outlined.Search, if (searching) "Close search" else "Search tasks")
                }
                Box(Modifier.size(40.dp).background(MaterialTheme.colorScheme.primaryContainer, CircleShape), contentAlignment = Alignment.Center) {
                    Icon(Icons.Outlined.PersonOutline, "Your workspace", tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(24.dp))
                }
            }
        }
        item {
            Column(Modifier.padding(top = 12.dp, bottom = 8.dp)) {
                Text(today.format(DateFormat), style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                Spacer(Modifier.height(8.dp))
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
                label = { Text("Search tasks") }, leadingIcon = { Icon(Icons.Outlined.Search, null) }, shape = RowShape,
                keyboardOptions = KeyboardOptions(imeAction = ImeAction.Search))
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
                            DropdownMenuItem(text = { Text(option) }, onClick = { status = option; expanded = false },
                                leadingIcon = { if (status == option) Icon(Icons.Outlined.Check, contentDescription = "Selected") else Spacer(Modifier.size(24.dp)) })
                        }
                    }
                }
            }
        }
        item {
            val haptics = LocalHapticFeedback.current
            Row(Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                (listOf("All") + Category.entries.map { it.name }).forEach { name ->
                    FilterChip(selected = category == name, onClick = {
                            if (category != name) haptics.performHapticFeedback(HapticFeedbackType.SegmentTick)
                            category = name
                        }, label = { Text(name) },
                        leadingIcon = if (name != "All") ({ Box(Modifier.size(8.dp).background(categoryColor(Category.valueOf(name)), CircleShape)) }) else null,
                        shape = ChipShape,
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
                Icon(Icons.Outlined.Spa, null, Modifier.size(16.dp), tint = MaterialTheme.colorScheme.onSurfaceVariant)
                Spacer(Modifier.width(8.dp))
                Text("One thing at a time is enough.", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
    }
}

@Composable
private fun WeekStrip(selected: LocalDate, onSelect: (LocalDate) -> Unit) {
    val today = LocalDate.now()
    val start = today.minusDays((today.dayOfWeek.value - 1).toLong())
    val haptics = LocalHapticFeedback.current
    Row(Modifier.fillMaxWidth().padding(vertical = 8.dp), horizontalArrangement = Arrangement.spacedBy(4.dp)) {
        repeat(7) { offset ->
            val day = start.plusDays(offset.toLong())
            val active = day == selected
            val color by animateColorAsState(if (active) MaterialTheme.colorScheme.primary else Color.Transparent, label = "day selection")
            val foreground = if (active) MaterialTheme.colorScheme.onPrimary else MaterialTheme.colorScheme.onSurface
            Column(
                Modifier.weight(1f).clip(RowShape).background(color)
                    .clickable {
                        if (!active) haptics.performHapticFeedback(HapticFeedbackType.SegmentTick)
                        onSelect(day)
                    }.semantics { contentDescription = day.format(DateFormat); this.selected = active }
                    .padding(vertical = 12.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Text(day.dayOfWeek.getDisplayName(TextStyle.SHORT, Locale.getDefault()).take(2), style = MaterialTheme.typography.labelSmall, color = if (active) foreground else MaterialTheme.colorScheme.onSurfaceVariant)
                Spacer(Modifier.height(8.dp))
                Text(day.dayOfMonth.toString(), color = foreground, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
                Spacer(Modifier.height(8.dp))
                Box(Modifier.size(4.dp).background(if (day == today) foreground else Color.Transparent, CircleShape))
            }
        }
    }
}

@Composable
private fun ProgressCard(completed: Int, total: Int) {
    val progress by animateFloatAsState(if (total == 0) 0f else completed.toFloat() / total, label = "daily progress")
    Surface(shape = CardShape, color = MaterialTheme.colorScheme.primaryContainer) {
        Row(Modifier.fillMaxWidth().padding(24.dp), verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text(if (total > 0 && completed == total) "Look at you go." else "Little steps. Big things.", style = MaterialTheme.typography.titleMedium)
                Spacer(Modifier.height(4.dp))
                Text(if (total == 0) "A fresh page for your day." else "$completed of $total tasks completed", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onPrimaryContainer)
                Spacer(Modifier.height(16.dp))
                LinearProgressIndicator(progress = { progress }, Modifier.width(152.dp).height(4.dp).clip(CircleShape), color = MaterialTheme.colorScheme.primary, trackColor = MaterialTheme.colorScheme.primary.copy(alpha = .12f), drawStopIndicator = {})
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
                Icon(Icons.Outlined.Check, null, Modifier.size(24.dp), tint = ink)
            }
        }
    }
}

@Composable
private fun SectionLabel(title: String, count: Int) {
    Row(Modifier.padding(top = 8.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        Text(title, style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Text(count.toString(), style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.background(MaterialTheme.colorScheme.surfaceVariant, CircleShape).padding(horizontal = 8.dp))
    }
}

@Composable
private fun TaskCard(task: Task, showDate: Boolean, onClick: () -> Unit, onToggle: () -> Unit) {
    val haptics = LocalHapticFeedback.current
    Surface(onClick = onClick, shape = RowShape, color = MaterialTheme.colorScheme.surface,
        border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)) {
        Row(Modifier.fillMaxWidth().padding(start = 4.dp, end = 16.dp, top = 16.dp, bottom = 16.dp), verticalAlignment = Alignment.Top) {
            Checkbox(checked = task.done, onCheckedChange = {
                    haptics.performHapticFeedback(if (task.done) HapticFeedbackType.ToggleOff else HapticFeedbackType.ToggleOn)
                    onToggle()
                },
                modifier = Modifier.semantics { contentDescription = if (task.done) "Mark ${task.title} incomplete" else "Complete ${task.title}" },
                colors = CheckboxDefaults.colors(checkedColor = MaterialTheme.colorScheme.primary, uncheckedColor = MaterialTheme.colorScheme.outline))
            Column(Modifier.weight(1f).padding(top = 2.dp)) {
                Text(task.title, style = MaterialTheme.typography.titleMedium, color = if (task.done) MaterialTheme.colorScheme.onSurfaceVariant else MaterialTheme.colorScheme.onSurface,
                    textDecoration = if (task.done) TextDecoration.LineThrough else TextDecoration.None, maxLines = 2, overflow = TextOverflow.Ellipsis)
                Spacer(Modifier.height(8.dp))
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    CategoryBadge(task.category)
                    if (task.time.isNotBlank() || showDate) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                            Icon(Icons.Outlined.Schedule, null, Modifier.size(16.dp), tint = MaterialTheme.colorScheme.onSurfaceVariant)
                            Text(if (showDate) task.date.format(DateTimeFormatter.ofPattern("MMM d")) else task.time,
                                style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                    }
                    if (task.checklist.isNotEmpty()) Text("${task.checklist.count { it.done }}/${task.checklist.size}", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
            if (task.priority == Priority.High && !task.done) Icon(Icons.Outlined.Flag, "High priority", Modifier.padding(top = 4.dp).size(16.dp), tint = DaylightTheme.colors.priorityHigh)
        }
    }
}

@Composable
private fun categoryColor(category: Category): Color = when (category) {
    Category.Work -> DaylightTheme.colors.work
    Category.Personal -> DaylightTheme.colors.personal
    Category.Wellness -> DaylightTheme.colors.wellness
}

@Composable
private fun CategoryBadge(category: Category) {
    val color = categoryColor(category)
    Row(Modifier.background(color.copy(alpha = .12f), BadgeShape).padding(horizontal = 8.dp, vertical = 4.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
        Box(Modifier.size(8.dp).background(color, CircleShape))
        Text(category.name, style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurface)
    }
}

@Composable
private fun EmptyState(title: String, description: String, onNew: () -> Unit) {
    Column(Modifier.fillMaxWidth().padding(vertical = 32.dp), horizontalAlignment = Alignment.CenterHorizontally) {
        Icon(Icons.Outlined.CheckCircleOutline, null, Modifier.size(40.dp), tint = MaterialTheme.colorScheme.primary)
        Spacer(Modifier.height(16.dp)); Text(title, style = MaterialTheme.typography.titleLarge)
        Spacer(Modifier.height(8.dp)); Text(description, color = MaterialTheme.colorScheme.onSurfaceVariant, style = MaterialTheme.typography.bodyMedium, textAlign = androidx.compose.ui.text.style.TextAlign.Center)
        Spacer(Modifier.height(16.dp)); FilledTonalButton(onClick = onNew) { Text("Create a task") }
    }
}

@Composable
private fun PageHeader(title: String, onBack: () -> Unit, action: @Composable RowScope.() -> Unit = {}) {
    // Scaffold padding already covers the status bar, so the app bar adds no insets of its own.
    TopAppBar(
        title = { Text(title) },
        navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Outlined.ArrowBack, "Back") } },
        actions = action,
        windowInsets = WindowInsets(0, 0, 0, 0),
        colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.background),
    )
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
    val haptics = LocalHapticFeedback.current
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
            Text("${title.length}/120", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(end = 16.dp))
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
                shape = RowShape, maxLines = 3,
                keyboardOptions = KeyboardOptions(capitalization = KeyboardCapitalization.Sentences, imeAction = ImeAction.Next))
            OutlinedTextField(notes, { notes = it }, Modifier.fillMaxWidth(), label = { Text("Notes") },
                placeholder = { Text("A few details, a thought, a starting point…") }, minLines = 3, maxLines = 6,
                shape = RowShape, keyboardOptions = KeyboardOptions(capitalization = KeyboardCapitalization.Sentences))
            Column {
                FormLabel("Category")
                Row(Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Category.entries.forEach { item ->
                        FilterChip(category == item, { category = item }, label = { Text(item.name) },
                            leadingIcon = { Box(Modifier.size(8.dp).background(categoryColor(item), CircleShape)) })
                    }
                }
            }
            Column {
                FormLabel("Schedule")
                Surface(shape = RowShape, color = MaterialTheme.colorScheme.surface) {
                    Column {
                        DetailRow(Icons.Outlined.CalendarToday, "Due date", date.format(DateTimeFormatter.ofPattern("EEE, MMM d, yyyy"))) {
                            DatePickerDialog(context, { _, year, month, day -> epoch = LocalDate.of(year, month + 1, day).toEpochDay() }, date.year, date.monthValue - 1, date.dayOfMonth).show()
                        }
                        HorizontalDivider(Modifier.padding(horizontal = 16.dp), color = MaterialTheme.colorScheme.outlineVariant)
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
                            leadingIcon = { Icon(Icons.Outlined.Flag, null, Modifier.size(FilterChipDefaults.IconSize)) })
                    }
                }
            }
            OutlinedTextField(checklist, { checklist = it }, Modifier.fillMaxWidth(), label = { Text("Small steps (optional)") },
                placeholder = { Text("One step on each line") }, supportingText = { Text("Break a bigger task into a few smaller steps.") },
                minLines = 2, shape = RowShape, keyboardOptions = KeyboardOptions(capitalization = KeyboardCapitalization.Sentences))
            Spacer(Modifier.height(4.dp))
        }
        Surface(color = MaterialTheme.colorScheme.background) {
            Button(onClick = {
                attempted = true
                if (title.isBlank()) {
                    haptics.performHapticFeedback(HapticFeedbackType.Reject)
                } else {
                    haptics.performHapticFeedback(HapticFeedbackType.Confirm)
                    val steps = checklist.lines().map { it.trim() }.filter { it.isNotBlank() }.map { text ->
                        ChecklistItem(text, existing?.checklist?.firstOrNull { it.title == text }?.done ?: false)
                    }
                    onSave((existing ?: Task(title = title.trim())).copy(title = title.trim(), notes = notes.trim(), category = category, priority = priority, date = date, time = time, checklist = steps))
                }
            }, modifier = Modifier.padding(24.dp).fillMaxWidth().heightIn(min = 56.dp)) {
                Icon(Icons.Outlined.Check, null, Modifier.size(ButtonDefaults.IconSize)); Spacer(Modifier.width(ButtonDefaults.IconSpacing))
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
    Row(Modifier.fillMaxWidth().then(if (onClick != null) Modifier.clickable(onClick = onClick) else Modifier).padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
        Icon(icon, null, Modifier.size(24.dp), tint = MaterialTheme.colorScheme.onSurfaceVariant)
        Spacer(Modifier.width(16.dp))
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
    val haptics = LocalHapticFeedback.current
    if (confirmDelete) AlertDialog(onDismissRequest = { confirmDelete = false },
        title = { Text("Delete this task?") }, text = { Text("“${task.title}” and its checklist will be permanently removed.") },
        confirmButton = { TextButton(onClick = { haptics.performHapticFeedback(HapticFeedbackType.Confirm); onDelete() }) { Text("Delete", color = MaterialTheme.colorScheme.error) } },
        dismissButton = { TextButton(onClick = { confirmDelete = false }) { Text("Keep task") } })
    Column(Modifier.fillMaxSize()) {
        PageHeader("Task details", onBack) {
            IconButton(onClick = onEdit) { Icon(Icons.Outlined.Edit, "Edit task") }
            IconButton(onClick = { confirmDelete = true }) { Icon(Icons.Outlined.DeleteOutline, "Delete task") }
        }
        Column(Modifier.weight(1f).verticalScroll(rememberScrollState()).padding(horizontal = 24.dp), verticalArrangement = Arrangement.spacedBy(24.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                CategoryBadge(task.category)
                if (task.done) Text("Completed", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.primary)
            }
            Text(task.title, style = MaterialTheme.typography.displaySmall)
            if (task.notes.isNotBlank()) Text(task.notes, style = MaterialTheme.typography.bodyLarge, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Surface(shape = CardShape, color = MaterialTheme.colorScheme.surface) {
                Column {
                    DetailRow(Icons.Outlined.CalendarToday, "Due date", task.date.format(DateFormat))
                    HorizontalDivider(Modifier.padding(horizontal = 16.dp), color = MaterialTheme.colorScheme.outlineVariant)
                    if (task.time.isNotBlank()) {
                        DetailRow(Icons.Outlined.Schedule, "Time", task.time)
                        HorizontalDivider(Modifier.padding(horizontal = 16.dp), color = MaterialTheme.colorScheme.outlineVariant)
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
                        Surface(shape = ChipShape, color = MaterialTheme.colorScheme.surface) {
                            // One target for the whole row; the checkbox only shows the state.
                            Row(Modifier.fillMaxWidth().toggleable(value = item.done, role = Role.Checkbox, onValueChange = { done ->
                                    haptics.performHapticFeedback(if (done) HapticFeedbackType.ToggleOn else HapticFeedbackType.ToggleOff)
                                    onChecklist(index)
                                }).padding(8.dp), verticalAlignment = Alignment.CenterVertically) {
                                Checkbox(item.done, onCheckedChange = null, modifier = Modifier.minimumInteractiveComponentSize())
                                Text(item.title, modifier = Modifier.weight(1f).padding(end = 8.dp), style = MaterialTheme.typography.bodyLarge,
                                    textDecoration = if (item.done) TextDecoration.LineThrough else TextDecoration.None)
                            }
                        }
                    }
                }
            }
            Spacer(Modifier.height(8.dp))
        }
        Button(onClick = {
            haptics.performHapticFeedback(if (task.done) HapticFeedbackType.ToggleOff else HapticFeedbackType.Confirm)
            onToggle()
        }, Modifier.padding(24.dp).fillMaxWidth().heightIn(min = 56.dp)) {
            Icon(if (task.done) Icons.Outlined.Replay else Icons.Outlined.CheckCircleOutline, null, Modifier.size(ButtonDefaults.IconSize))
            Spacer(Modifier.width(ButtonDefaults.IconSpacing)); Text(if (task.done) "Mark as incomplete" else "Complete task")
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
            Row(Modifier.fillMaxWidth().padding(24.dp), verticalAlignment = Alignment.CenterVertically) {
                Box(Modifier.size(48.dp).background(MaterialTheme.colorScheme.primary, CircleShape), contentAlignment = Alignment.Center) {
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
                    AppearanceSetting(store.themeMode, store::setTheme)
                    HorizontalDivider(Modifier.padding(horizontal = 16.dp), color = MaterialTheme.colorScheme.outlineVariant)
                    SettingToggle(Icons.Outlined.TaskAlt, "Show completed tasks", "Keep your little wins in view", store.showCompleted, store::setCompleted)
                    HorizontalDivider(Modifier.padding(horizontal = 16.dp), color = MaterialTheme.colorScheme.outlineVariant)
                    SettingToggle(Icons.Outlined.Flag, "Prioritize what matters", "Sort high-priority tasks first", store.sortByPriority, store::setSorting)
                }
            }
        }
        Column {
            FormLabel("Your tasks")
            Surface(shape = CardShape, color = MaterialTheme.colorScheme.surface) {
                Column {
                    DetailRow(Icons.Outlined.Inventory2, "Saved on this device", "${store.tasks.count { !it.done }} active · ${store.tasks.count { it.done }} completed")
                    HorizontalDivider(Modifier.padding(horizontal = 16.dp), color = MaterialTheme.colorScheme.outlineVariant)
                    TextButton(onClick = { clearDialog = true }, enabled = store.tasks.any { it.done }, modifier = Modifier.padding(8.dp)) {
                        Icon(Icons.Outlined.DeleteSweep, null, Modifier.size(ButtonDefaults.IconSize)); Spacer(Modifier.width(ButtonDefaults.IconSpacing)); Text("Clear completed tasks")
                    }
                }
            }
        }
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            Icon(Icons.Outlined.Lock, null, Modifier.size(16.dp), tint = MaterialTheme.colorScheme.onSurfaceVariant)
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
    val haptics = LocalHapticFeedback.current
    // The whole row toggles the switch (bigger target, ripple on the row, one TalkBack stop).
    Row(Modifier.fillMaxWidth().toggleable(value = checked, role = Role.Switch, onValueChange = { on ->
            haptics.performHapticFeedback(if (on) HapticFeedbackType.ToggleOn else HapticFeedbackType.ToggleOff)
            onChange(on)
        }).padding(horizontal = 16.dp, vertical = 16.dp), verticalAlignment = Alignment.CenterVertically) {
        Icon(icon, null, Modifier.size(24.dp), tint = MaterialTheme.colorScheme.primary)
        Spacer(Modifier.width(16.dp))
        Column(Modifier.weight(1f)) {
            Text(title, style = MaterialTheme.typography.titleMedium)
            Text(subtitle, style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        Spacer(Modifier.width(8.dp))
        Switch(checked, onCheckedChange = null)
    }
}

@Composable
private fun AppearanceSetting(mode: ThemeMode, onChange: (ThemeMode) -> Unit) {
    val haptics = LocalHapticFeedback.current
    Column(Modifier.fillMaxWidth().padding(16.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Outlined.DarkMode, null, Modifier.size(24.dp), tint = MaterialTheme.colorScheme.primary)
            Spacer(Modifier.width(16.dp))
            Column(Modifier.weight(1f)) {
                Text("Appearance", style = MaterialTheme.typography.titleMedium)
                Text("System follows your phone's dark theme setting", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
        Spacer(Modifier.height(12.dp))
        SingleChoiceSegmentedButtonRow(Modifier.fillMaxWidth()) {
            ThemeMode.entries.forEachIndexed { index, option ->
                SegmentedButton(
                    selected = mode == option,
                    onClick = {
                        if (mode != option) haptics.performHapticFeedback(HapticFeedbackType.SegmentTick)
                        onChange(option)
                    },
                    shape = SegmentedButtonDefaults.itemShape(index = index, count = ThemeMode.entries.size),
                    label = { Text(option.name) },
                )
            }
        }
    }
}

@Composable
private fun MissingTask(onBack: () -> Unit) {
    Column(Modifier.fillMaxSize(), verticalArrangement = Arrangement.Center, horizontalAlignment = Alignment.CenterHorizontally) {
        Text("This task is no longer here.", style = MaterialTheme.typography.titleLarge)
        TextButton(onClick = onBack) { Text("Back to tasks") }
    }
}
