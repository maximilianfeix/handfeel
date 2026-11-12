import SwiftUI

@main
struct RecipesApp: App {
    @State private var store = RecipeStore()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(store)
                .tint(Theme.accent)
                .preferredColorScheme(store.appearance.colorScheme)
        }
    }
}
