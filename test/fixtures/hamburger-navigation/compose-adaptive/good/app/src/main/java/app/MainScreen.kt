package app
import androidx.compose.runtime.Composable
@Composable fun N(compact: Boolean) { if (compact) NavigationBar { } else ModalNavigationDrawer(drawerContent = {}) { } }
