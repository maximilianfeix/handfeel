import SwiftUI

struct RootView: View {
    @Environment(RecipeStore.self) private var store

    var body: some View {
        TabView {
            Tab("Discover", systemImage: "fork.knife") { HomeView() }
            Tab("Favorites", systemImage: "heart.fill") { FavoritesView() }
                .badge(store.favorites.count)
            Tab("Settings", systemImage: "gearshape.fill") { SettingsView() }
        }
    }
}
