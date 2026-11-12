import SwiftUI

struct RecipeCard: View {
    let recipe: Recipe

    var body: some View {
        VStack(alignment: .leading, spacing: Theme.Space.xs) {
            HStack(spacing: Theme.Space.m) {
                Chip(icon: "clock", text: "\(recipe.minutes) min")
                Chip(icon: "star.fill", text: String(format: "%.1f", recipe.rating))
            }
            Text(recipe.title).font(.title3.bold())
            Text(recipe.subtitle).font(.subheadline)
        }
        .foregroundStyle(.white)
        .padding(Theme.Space.l)
        .padding(.top, Theme.Space.xl)
        .frame(maxWidth: .infinity, alignment: .leading)
        // Scrim behind the text so white text stays readable on every artwork palette.
        .background(
            LinearGradient(colors: [.clear, .black.opacity(0.6)], startPoint: .top, endPoint: .bottom)
        )
        // The card grows with the text at large Dynamic Type sizes instead of clipping it.
        .frame(maxWidth: .infinity, minHeight: 220, alignment: .bottomLeading)
        .background { RecipeArt(recipe: recipe, symbolSize: 96) }
        .overlay(alignment: .topTrailing) { FavoriteButton(recipe: recipe).padding(Theme.Space.m) }
        .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.large, style: .continuous))
    }
}

struct RecipeRow: View {
    let recipe: Recipe
    var body: some View {
        HStack(spacing: Theme.Space.m) {
            RecipeArt(recipe: recipe, symbolSize: 28)
                .frame(width: 64, height: 64)
                .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.small, style: .continuous))
            VStack(alignment: .leading, spacing: Theme.Space.xs) {
                Text(recipe.title).font(.headline)
                Text(recipe.subtitle).font(.subheadline).foregroundStyle(.secondary).lineLimit(1)
                Text("\(recipe.minutes) min  ·  \(recipe.calories) kcal")
                    .font(.caption.weight(.medium)).foregroundStyle(.secondary)
            }
        }
        .padding(.vertical, Theme.Space.xs)
        .accessibilityElement(children: .combine)
    }
}
