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

    /// Spacing scale (4-point grid).
    enum Space {
        static let xs: CGFloat = 4
        static let s: CGFloat = 8
        static let m: CGFloat = 12
        static let l: CGFloat = 16
        static let xl: CGFloat = 24
    }

    /// Corner radii, from small to large.
    enum Radius {
        static let small: CGFloat = 12
        static let medium: CGFloat = 16
        static let large: CGFloat = 24
    }

    /// Artwork palettes for the recipe placeholders. Artwork, not UI chrome:
    /// they stand in for food photos and are the same in light and dark mode.
    enum Art {
        static let tomato = [Color(hex: 0xFF7A59), Color(hex: 0xD93F2B)]
        static let herb = [Color(hex: 0x7BC47F), Color(hex: 0x2E8B57)]
        static let saffron = [Color(hex: 0xF5C451), Color(hex: 0xE08A1E)]
        static let turmeric = [Color(hex: 0xFFB347), Color(hex: 0xC8561B)]
        static let berry = [Color(hex: 0xF7A8C4), Color(hex: 0xC95A8A)]
        static let lime = [Color(hex: 0x6CC5C9), Color(hex: 0x23808A)]
        static let cocoa = [Color(hex: 0x9C6B55), Color(hex: 0x4A2C23)]
        static let strawberry = [Color(hex: 0xFFD8C2), Color(hex: 0xE58B86)]
    }

    static func gradient(_ colors: [Color]) -> LinearGradient {
        LinearGradient(colors: colors, startPoint: .topLeading, endPoint: .bottomTrailing)
    }
}

/// Decorative "photo" replacement: a soft gradient with a large SF Symbol.
/// Purely decorative, so it is hidden from VoiceOver; the title next to it carries the meaning.
struct RecipeArt: View {
    let recipe: Recipe
    var symbolSize: CGFloat = 84

    var body: some View {
        ZStack {
            Theme.gradient(recipe.colors)
            Circle().fill(.white.opacity(0.14)).frame(width: symbolSize * 2.2).offset(x: symbolSize * 0.9, y: -symbolSize * 0.7)
            Circle().fill(.white.opacity(0.10)).frame(width: symbolSize * 1.5).offset(x: -symbolSize * 1.1, y: symbolSize * 0.8)
            Image(systemName: recipe.symbol)
                .font(.system(size: symbolSize * 0.8, weight: .medium))
                .foregroundStyle(.white.opacity(0.9))
        }
        .accessibilityHidden(true)
    }
}

/// Small metadata label shown on top of recipe artwork (inside the dark scrim).
struct Chip: View {
    let icon: String
    let text: String
    var body: some View {
        Label(text, systemImage: icon)
            .font(.caption.weight(.semibold))
    }
}

struct FavoriteButton: View {
    @Environment(RecipeStore.self) private var store
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    let recipe: Recipe

    var body: some View {
        let fav = store.isFavorite(recipe)
        Button {
            withAnimation(reduceMotion ? nil : .snappy) { store.toggleFavorite(recipe) }
        } label: {
            Image(systemName: fav ? "heart.fill" : "heart")
                .font(.headline)
                .foregroundStyle(fav ? Color.red : Color.primary)
                .frame(width: 44, height: 44)
                .background(.regularMaterial, in: Circle())
                .contentShape(Circle())
        }
        .buttonStyle(.plain)
        .accessibilityLabel(fav ? "Remove from favorites" : "Add to favorites")
    }
}
