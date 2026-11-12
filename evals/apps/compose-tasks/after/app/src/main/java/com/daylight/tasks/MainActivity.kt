package com.daylight.tasks

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.SystemBarStyle
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.lifecycle.viewmodel.compose.viewModel
import com.daylight.tasks.data.TaskStore
import com.daylight.tasks.data.ThemeMode
import com.daylight.tasks.ui.DaylightApp
import com.daylight.tasks.ui.theme.DaylightTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            val store: TaskStore = viewModel()
            // Follow the system appearance unless the person picked Light or Dark in Settings.
            val dark = when (store.themeMode) {
                ThemeMode.System -> isSystemInDarkTheme()
                ThemeMode.Light -> false
                ThemeMode.Dark -> true
            }
            SideEffect {
                val style = if (dark) SystemBarStyle.dark(Color.Transparent.toArgb())
                    else SystemBarStyle.light(Color.Transparent.toArgb(), Color.Transparent.toArgb())
                enableEdgeToEdge(statusBarStyle = style, navigationBarStyle = style)
            }
            DaylightTheme(dark) { DaylightApp(store) }
        }
    }
}
