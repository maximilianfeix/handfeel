import SwiftUI

struct FavoritesView: View {
    @Environment(RecipeStore.self) private var store

    var body: some View {
        NavigationStack {
            Group {
                if store.favorites.isEmpty {
                    ContentUnavailableView(
                        "No favorites yet",
                        systemImage: "heart",
                        description: Text("Tap the heart on any recipe to save it here.")
                    )
                } else {
                    ScrollView {
                        LazyVStack(spacing: 12) {
                            ForEach(store.favorites) { recipe in
                                NavigationLink(value: recipe) { RecipeRow(recipe: recipe) }
                                    .buttonStyle(.plain)
                                    .contextMenu {
                                        Button("Remove", systemImage: "heart.slash", role: .destructive) {
                                            withAnimation { store.toggleFavorite(recipe) }
                                        }
                                    }
                            }
                        }
                        .padding(20)
                    }
                }
            }
            .background(Theme.background)
            .navigationTitle("Favorites")
            .navigationDestination(for: Recipe.self) { RecipeDetailView(recipe: $0) }
            .animation(.snappy, value: store.favorites)
        }
    }
}
