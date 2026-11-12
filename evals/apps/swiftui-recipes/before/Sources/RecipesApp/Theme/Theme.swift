import SwiftUI

extension Color {
    init(hex: UInt32) {
        self.init(.sRGB,
                  red: Double((hex >> 16) & 0xFF) / 255,
                  green: Double((hex >> 8) & 0xFF) / 255,
                  blue: Double(hex & 0xFF) / 255)
    }
}

enum Theme {
    static let accent = Color(hex: 0xF2622E)
    static let background = Color(UIColor.systemGroupedBackground)
    static let card = Color(UIColor.secondarySystemGroupedBackground)

    static func gradient(_ colors: [Color]) -> LinearGradient {
        LinearGradient(colors: colors, startPoint: .topLeading, endPoint: .bottomTrailing)
    }
}

/// Decorative "photo" replacement: gradient with a large soft emoji.
struct RecipeArt: View {
    let recipe: Recipe
    var emojiSize: CGFloat = 84

    var body: some View {
        ZStack {
            Theme.gradient(recipe.colors)
            Circle().fill(.white.opacity(0.14)).frame(width: emojiSize * 2.2).offset(x: emojiSize * 0.9, y: -emojiSize * 0.7)
            Circle().fill(.white.opacity(0.10)).frame(width: emojiSize * 1.5).offset(x: -emojiSize * 1.1, y: emojiSize * 0.8)
            Text(recipe.emoji)
                .font(.system(size: emojiSize))
                .shadow(color: .black.opacity(0.25), radius: 12, y: 8)
        }
    }
}

struct Chip: View {
    let icon: String
    let text: String
    var body: some View {
        Label(text, systemImage: icon)
            .font(.caption.weight(.semibold))
            .padding(.horizontal, 10).padding(.vertical, 6)
            .background(.ultraThinMaterial, in: Capsule())
    }
}

struct FavoriteButton: View {
    @Environment(RecipeStore.self) private var store
    let recipe: Recipe

    var body: some View {
        let fav = store.isFavorite(recipe)
        Button {
            withAnimation(.spring(response: 0.3, dampingFraction: 0.55)) { store.toggleFavorite(recipe) }
        } label: {
            Image(systemName: fav ? "heart.fill" : "heart")
                .font(.headline)
                .foregroundStyle(fav ? Color.red : Color.primary)
                .frame(width: 38, height: 38)
                .background(.ultraThinMaterial, in: Circle())
                .scaleEffect(fav ? 1.08 : 1)
        }
        .buttonStyle(.plain)
        .accessibilityLabel(fav ? "Remove from favorites" : "Add to favorites")
    }
}
