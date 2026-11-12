import SwiftUI

struct HomeView: View {
    @Environment(RecipeStore.self) private var store
    @State private var query = ""
    @State private var category: Category = .all

    private var results: [Recipe] { store.search(query, category: category) }

    var body: some View {
        NavigationStack {
            ScrollView {
                LazyVStack(alignment: .leading, spacing: 20) {
                    header
                    categoryPicker
                    if results.isEmpty {
                        ContentUnavailableView.search(text: query)
                            .padding(.top, 40)
                    } else {
                        ForEach(results) { recipe in
                            NavigationLink(value: recipe) { RecipeCard(recipe: recipe) }
                                .buttonStyle(.plain)
                        }
                    }
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 24)
            }
            .background(Theme.background)
            .navigationTitle("Discover")
            .navigationDestination(for: Recipe.self) { RecipeDetailView(recipe: $0) }
            .searchable(text: $query, prompt: "Recipes or ingredients")
            .animation(.snappy, value: results)
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("What are we cooking today?")
                .font(.system(.title2, design: .rounded, weight: .bold))
            Text("\(store.recipes.count) hand-picked recipes")
                .font(.subheadline).foregroundStyle(.secondary)
        }
        .padding(.top, 4)
    }

    private var categoryPicker: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 10) {
                ForEach(Category.allCases) { c in
                    Button { withAnimation(.snappy) { category = c } } label: {
                        Text(c.rawValue)
                            .font(.subheadline.weight(.semibold))
                            .padding(.horizontal, 16).padding(.vertical, 9)
                            .foregroundStyle(category == c ? .white : .primary)
                            .background(category == c ? AnyShapeStyle(Theme.accent) : AnyShapeStyle(Theme.card), in: Capsule())
                    }
                    .buttonStyle(.plain)
                }
            }
        }
        .scrollClipDisabled()
    }
}
