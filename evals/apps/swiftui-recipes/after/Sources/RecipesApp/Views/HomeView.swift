import SwiftUI

struct HomeView: View {
    @Environment(RecipeStore.self) private var store
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var query = ""
    @State private var category: Category = .all

    private var results: [Recipe] { store.search(query, category: category) }

    var body: some View {
        NavigationStack {
            ScrollView {
                LazyVStack(alignment: .leading, spacing: Theme.Space.xl) {
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
                .padding(.horizontal, Theme.Space.l)
                .padding(.bottom, Theme.Space.xl)
            }
            .background(Theme.background)
            .navigationTitle("Discover")
            .navigationDestination(for: Recipe.self) { RecipeDetailView(recipe: $0) }
            .searchable(text: $query, prompt: "Recipes or ingredients")
            .animation(reduceMotion ? nil : .snappy, value: results)
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: Theme.Space.xs) {
            Text("What are we cooking today?")
                .font(.system(.title2, design: .rounded, weight: .bold))
            Text("\(store.recipes.count) hand-picked recipes")
                .font(.subheadline).foregroundStyle(.secondary)
        }
        .padding(.top, Theme.Space.xs)
    }

    private var categoryPicker: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: Theme.Space.s) {
                ForEach(Category.allCases) { c in
                    let selected = category == c
                    Button { category = c } label: {
                        Text(c.rawValue)
                            .font(.subheadline.weight(.semibold))
                            .padding(.horizontal, Theme.Space.l)
                            .frame(minHeight: 44)
                            // Neutral inverted fill for the selection: high contrast in light and dark,
                            // and it leaves the accent for actions.
                            .foregroundStyle(selected ? Color(UIColor.systemBackground) : Color.primary)
                            .background(selected ? Color.primary : Theme.card, in: Capsule())
                            .contentShape(Capsule())
                    }
                    .buttonStyle(.plain)
                    .accessibilityAddTraits(selected ? .isSelected : [])
                }
            }
        }
        .scrollClipDisabled()
        .sensoryFeedback(.selection, trigger: category) { _, _ in store.hapticsEnabled }
    }
}
