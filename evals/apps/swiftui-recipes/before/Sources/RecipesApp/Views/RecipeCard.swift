import SwiftUI

struct RecipeCard: View {
    let recipe: Recipe

    var body: some View {
        RecipeArt(recipe: recipe, emojiSize: 96)
            .frame(height: 220)
            .overlay(alignment: .bottomLeading) {
                VStack(alignment: .leading, spacing: 6) {
                    HStack(spacing: 6) {
                        Chip(icon: "clock", text: "\(recipe.minutes) min")
                        Chip(icon: "star.fill", text: String(format: "%.1f", recipe.rating))
                    }
                    Text(recipe.title).font(.title3.bold())
                    Text(recipe.subtitle).font(.subheadline).opacity(0.9)
                }
                .foregroundStyle(.white)
                .padding(16)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(
                    LinearGradient(colors: [.clear, .black.opacity(0.45)], startPoint: .top, endPoint: .bottom)
                )
            }
            .overlay(alignment: .topTrailing) { FavoriteButton(recipe: recipe).padding(12) }
            .clipShape(RoundedRectangle(cornerRadius: 26, style: .continuous))
            .shadow(color: recipe.colors.last!.opacity(0.30), radius: 14, y: 8)
    }
}

struct RecipeRow: View {
    let recipe: Recipe
    var body: some View {
        HStack(spacing: 14) {
            RecipeArt(recipe: recipe, emojiSize: 34)
                .frame(width: 76, height: 76)
                .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
            VStack(alignment: .leading, spacing: 4) {
                Text(recipe.title).font(.headline)
                Text(recipe.subtitle).font(.subheadline).foregroundStyle(.secondary).lineLimit(1)
                Text("\(recipe.minutes) min  ·  \(recipe.calories) kcal")
                    .font(.caption.weight(.medium)).foregroundStyle(Theme.accent)
            }
            Spacer(minLength: 0)
            Image(systemName: "chevron.right").font(.footnote.bold()).foregroundStyle(.tertiary)
        }
        .padding(12)
        .background(Theme.card, in: RoundedRectangle(cornerRadius: 22, style: .continuous))
    }
}
