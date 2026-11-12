import SwiftUI

struct RecipeDetailView: View {
    @Environment(RecipeStore.self) private var store
    let recipe: Recipe
    @State private var servings: Int
    @State private var checked: Set<UUID> = []
    @State private var doneSteps: Set<Int> = []

    init(recipe: Recipe) {
        self.recipe = recipe
        _servings = State(initialValue: recipe.servings)
    }

    private var scale: Double { Double(servings) / Double(recipe.servings) }

    var body: some View {
        ScrollView {
            VStack(spacing: 0) {
                RecipeArt(recipe: recipe, emojiSize: 130)
                    .frame(height: 300)
                    .overlay(alignment: .topTrailing) { FavoriteButton(recipe: recipe).padding(16) }

                VStack(alignment: .leading, spacing: 24) {
                    titleBlock
                    statsRow
                    ingredientsSection
                    stepsSection
                }
                .padding(20)
                .background(Theme.background, in: UnevenRoundedRectangle(topLeadingRadius: 30, topTrailingRadius: 30))
                .offset(y: -30)
                .padding(.bottom, -30)
            }
        }
        .ignoresSafeArea(edges: .top)
        .background(Theme.background)
        .navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(.hidden, for: .navigationBar)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                ShareLink(item: "\(recipe.title): \(recipe.subtitle)")
            }
        }
        .onAppear { UIApplication.shared.isIdleTimerDisabled = store.keepScreenAwake }
        .onDisappear { UIApplication.shared.isIdleTimerDisabled = false }
    }

    private var titleBlock: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(recipe.category.rawValue.uppercased())
                .font(.caption.weight(.heavy)).tracking(1.2).foregroundStyle(Theme.accent)
            Text(recipe.title).font(.system(.largeTitle, design: .rounded, weight: .bold))
            Text(recipe.subtitle).font(.body).foregroundStyle(.secondary)
        }
    }

    private var statsRow: some View {
        HStack(spacing: 12) {
            stat("clock.fill", "\(recipe.minutes)", "minutes")
            stat("flame.fill", "\(Int(Double(recipe.calories)))", "kcal")
            stat("star.fill", String(format: "%.1f", recipe.rating), "rating")
        }
    }

    private func stat(_ icon: String, _ value: String, _ label: String) -> some View {
        VStack(spacing: 4) {
            Image(systemName: icon).foregroundStyle(Theme.accent)
            Text(value).font(.headline)
            Text(label).font(.caption).foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity).padding(.vertical, 14)
        .background(Theme.card, in: RoundedRectangle(cornerRadius: 20, style: .continuous))
    }

    private var ingredientsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Ingredients").font(.title3.bold())
                Spacer()
                Stepper(value: $servings, in: 1...24) {
                    Text("\(servings) servings").font(.subheadline.weight(.medium)).monospacedDigit()
                }
                .fixedSize()
            }
            VStack(spacing: 0) {
                ForEach(Array(recipe.ingredients.enumerated()), id: \.element.id) { i, ing in
                    Button {
                        withAnimation(.snappy) {
                            if checked.contains(ing.id) { checked.remove(ing.id) } else { checked.insert(ing.id) }
                        }
                    } label: {
                        HStack {
                            Image(systemName: checked.contains(ing.id) ? "checkmark.circle.fill" : "circle")
                                .foregroundStyle(checked.contains(ing.id) ? Theme.accent : .secondary)
                            Text(ing.name).strikethrough(checked.contains(ing.id))
                            Spacer()
                            Text(format(ing)).foregroundStyle(.secondary).monospacedDigit()
                        }
                        .padding(.vertical, 12).padding(.horizontal, 16)
                        .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                    if i < recipe.ingredients.count - 1 { Divider().padding(.leading, 48) }
                }
            }
            .background(Theme.card, in: RoundedRectangle(cornerRadius: 22, style: .continuous))
        }
    }

    private var stepsSection: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("Method").font(.title3.bold())
            ForEach(Array(recipe.steps.enumerated()), id: \.offset) { i, step in
                let done = doneSteps.contains(i)
                HStack(alignment: .top, spacing: 14) {
                    Text("\(i + 1)")
                        .font(.subheadline.bold())
                        .frame(width: 30, height: 30)
                        .foregroundStyle(done ? .white : Theme.accent)
                        .background(done ? Theme.accent : Theme.accent.opacity(0.14), in: Circle())
                    Text(step)
                        .font(.body).lineSpacing(3)
                        .foregroundStyle(done ? .secondary : .primary)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }
                .padding(16)
                .background(Theme.card, in: RoundedRectangle(cornerRadius: 20, style: .continuous))
                .onTapGesture {
                    withAnimation(.snappy) {
                        if done { doneSteps.remove(i) } else { doneSteps.insert(i) }
                    }
                }
            }
        }
    }

    private func format(_ ing: Ingredient) -> String {
        var value = ing.amount * scale
        var unit = ing.unit
        if !store.useMetric {
            switch unit {
            case "g": value /= 28.35; unit = "oz"
            case "ml": value /= 29.57; unit = "fl oz"
            default: break
            }
        }
        let rounded = value >= 10 ? value.rounded() : (value * 10).rounded() / 10
        let number = rounded == rounded.rounded() ? String(Int(rounded)) : String(rounded)
        return unit.isEmpty ? number : "\(number) \(unit)"
    }
}
