import SwiftUI

struct RecipeDetailView: View {
    @Environment(RecipeStore.self) private var store
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize
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
                RecipeArt(recipe: recipe, symbolSize: 120)
                    .frame(height: 280)
                    .overlay(alignment: .topTrailing) { FavoriteButton(recipe: recipe).padding(Theme.Space.l) }

                VStack(alignment: .leading, spacing: Theme.Space.xl) {
                    titleBlock
                    statsRow
                    ingredientsSection
                    stepsSection
                }
                .padding(.horizontal, Theme.Space.l)
                .padding(.vertical, Theme.Space.xl)
                .background(Theme.background, in: UnevenRoundedRectangle(topLeadingRadius: Theme.Radius.large, topTrailingRadius: Theme.Radius.large))
                .offset(y: -Theme.Radius.large)
                .padding(.bottom, -Theme.Radius.large)
            }
        }
        .background(Theme.background)
        .navigationBarTitleDisplayMode(.inline)
        // Success haptic once, when the last step is ticked off (respects the app's haptics setting).
        .sensoryFeedback(.success, trigger: doneSteps.count, condition: finishedAllSteps)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                ShareLink(item: "\(recipe.title): \(recipe.subtitle)")
            }
        }
        .onAppear { UIApplication.shared.isIdleTimerDisabled = store.keepScreenAwake }
        .onDisappear { UIApplication.shared.isIdleTimerDisabled = false }
    }

    private func finishedAllSteps(_ old: Int, _ new: Int) -> Bool {
        store.hapticsEnabled && new > old && new == recipe.steps.count
    }

    private var titleBlock: some View {
        VStack(alignment: .leading, spacing: Theme.Space.xs) {
            Text(recipe.category.rawValue.uppercased())
                .font(.caption.weight(.semibold)).tracking(1.2).foregroundStyle(.secondary)
            Text(recipe.title).font(.system(.largeTitle, design: .rounded, weight: .bold))
            Text(recipe.subtitle).font(.body).foregroundStyle(.secondary)
        }
    }

    private var statsRow: some View {
        HStack(spacing: Theme.Space.m) {
            stat("clock.fill", "\(recipe.minutes)", "minutes")
            stat("flame.fill", "\(Int(Double(recipe.calories)))", "kcal")
            stat("star.fill", String(format: "%.1f", recipe.rating), "rating")
        }
    }

    private func stat(_ icon: String, _ value: String, _ label: String) -> some View {
        VStack(spacing: Theme.Space.xs) {
            Image(systemName: icon).foregroundStyle(Theme.accent).accessibilityHidden(true)
            Text(value).font(.headline)
            Text(label).font(.caption).foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity).padding(.vertical, Theme.Space.l)
        .background(Theme.card, in: RoundedRectangle(cornerRadius: Theme.Radius.medium, style: .continuous))
        .accessibilityElement(children: .combine)
    }

    private var ingredientsSection: some View {
        VStack(alignment: .leading, spacing: Theme.Space.m) {
            // At accessibility text sizes the stepper moves under the heading instead of overflowing.
            let header = dynamicTypeSize.isAccessibilitySize
                ? AnyLayout(VStackLayout(alignment: .leading, spacing: Theme.Space.s))
                : AnyLayout(HStackLayout())
            header {
                Text("Ingredients").font(.title3.bold())
                if !dynamicTypeSize.isAccessibilitySize { Spacer() }
                Stepper(value: $servings, in: 1...24) {
                    Text("\(servings) servings").font(.subheadline.weight(.medium)).monospacedDigit()
                }
                .fixedSize()
            }
            VStack(spacing: 0) {
                ForEach(Array(recipe.ingredients.enumerated()), id: \.element.id) { i, ing in
                    Button {
                        withAnimation(reduceMotion ? nil : .snappy) {
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
                        .padding(.vertical, Theme.Space.m).padding(.horizontal, Theme.Space.l)
                        .frame(minHeight: 44)
                        .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                    .accessibilityAddTraits(checked.contains(ing.id) ? .isSelected : [])
                    if i < recipe.ingredients.count - 1 { Divider().padding(.leading, 48) }
                }
            }
            .background(Theme.card, in: RoundedRectangle(cornerRadius: Theme.Radius.medium, style: .continuous))
        }
    }

    private var stepsSection: some View {
        VStack(alignment: .leading, spacing: Theme.Space.m) {
            Text("Method").font(.title3.bold())
            ForEach(Array(recipe.steps.enumerated()), id: \.offset) { i, step in
                let done = doneSteps.contains(i)
                Button {
                    withAnimation(reduceMotion ? nil : .snappy) {
                        if done { doneSteps.remove(i) } else { doneSteps.insert(i) }
                    }
                } label: {
                    HStack(alignment: .top, spacing: Theme.Space.m) {
                        Text("\(i + 1)")
                            .font(.subheadline.bold())
                            .frame(width: 32, height: 32)
                            .foregroundStyle(done ? .white : Theme.accent)
                            .background(done ? Theme.accent : Theme.accent.opacity(0.14), in: Circle())
                            .accessibilityLabel("Step \(i + 1)")
                        Text(step)
                            .font(.body).lineSpacing(4)
                            .foregroundStyle(done ? .secondary : .primary)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }
                    .padding(Theme.Space.l)
                    .background(Theme.card, in: RoundedRectangle(cornerRadius: Theme.Radius.medium, style: .continuous))
                    .contentShape(RoundedRectangle(cornerRadius: Theme.Radius.medium, style: .continuous))
                }
                .buttonStyle(.plain)
                .accessibilityElement(children: .combine)
                .accessibilityAddTraits(done ? .isSelected : [])
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
