package app
import androidx.compose.runtime.Composable
class Main : ComponentActivity() { override fun onCreate(b: Bundle?) { super.onCreate(b); setContent { Scaffold(topBar = {}) { _ -> Text("x") } } } }
