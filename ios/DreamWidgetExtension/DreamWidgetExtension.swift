import WidgetKit
import SwiftUI

// MARK: - Constants

private let appGroupID = "group.com.cherven.dreamapp"
private let snapshotKey = "widget-snapshot"

// MARK: - Snapshot Model

struct WidgetAction: Codable {
    let label: String
    let url: String
}

struct WidgetLastDream: Codable {
    let id: String
    let title: String
    let date: String?
}

struct WidgetSnapshot: Codable {
    let version: Int
    let state: String
    let title: String
    let subtitle: String
    let meta: String
    let primaryAction: WidgetAction
    let secondaryAction: WidgetAction
    let lastDream: WidgetLastDream?
}

// MARK: - Timeline

struct DreamEntry: TimelineEntry {
    let date: Date
    let snapshot: WidgetSnapshot?
}

// MARK: - Provider

struct DreamProvider: TimelineProvider {
    func placeholder(in context: Context) -> DreamEntry {
        DreamEntry(date: Date(), snapshot: nil)
    }

    func getSnapshot(in context: Context, completion: @escaping (DreamEntry) -> Void) {
        completion(DreamEntry(date: Date(), snapshot: readSnapshot()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<DreamEntry>) -> Void) {
        let entry = DreamEntry(date: Date(), snapshot: readSnapshot())
        completion(Timeline(entries: [entry], policy: .never))
    }

    private func readSnapshot() -> WidgetSnapshot? {
        guard
            let defaults = UserDefaults(suiteName: appGroupID),
            let raw = defaults.string(forKey: snapshotKey),
            let data = raw.data(using: .utf8)
        else { return nil }

        return try? JSONDecoder().decode(WidgetSnapshot.self, from: data)
    }
}

// MARK: - View

struct DreamWidgetEntryView: View {
    var entry: DreamEntry
    @Environment(\.widgetFamily) var family

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Spacer(minLength: 0)

            if let meta = entry.snapshot?.meta, !meta.isEmpty {
                Text(meta)
                    .font(.system(size: 11, weight: .medium))
                    .foregroundStyle(.white.opacity(0.45))
                    .lineLimit(1)
                    .padding(.bottom, 6)
            }

            Text(entry.snapshot?.title ?? "Capture your dream")
                .font(.system(size: 15, weight: .semibold))
                .foregroundStyle(.white)
                .lineLimit(2)
                .fixedSize(horizontal: false, vertical: true)

            Text(entry.snapshot?.subtitle ?? "Open the app to begin")
                .font(.system(size: 12, weight: .regular))
                .foregroundStyle(.white.opacity(0.6))
                .lineLimit(2)
                .fixedSize(horizontal: false, vertical: true)
                .padding(.top, 4)

            Spacer(minLength: 0)

            if family == .systemMedium {
                HStack(spacing: 8) {
                    actionPill(entry.snapshot?.primaryAction, secondary: false)
                    actionPill(entry.snapshot?.secondaryAction, secondary: true)
                }
                .padding(.top, 10)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .widgetURL(URL(string: entry.snapshot?.primaryAction.url ?? "dreamapp://capture"))
    }

    @ViewBuilder
    func actionPill(_ action: WidgetAction?, secondary: Bool) -> some View {
        if let action, let url = URL(string: action.url) {
            Link(destination: url) {
                Text(action.label)
                    .font(.system(size: 12, weight: .medium))
                    .foregroundStyle(secondary ? .white.opacity(0.65) : .white)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(secondary ? Color.white.opacity(0.08) : Color.white.opacity(0.18))
                    .clipShape(Capsule())
            }
        }
    }
}

// MARK: - Widget

struct DreamWidget: Widget {
    let kind: String = "DreamWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: DreamProvider()) { entry in
            DreamWidgetEntryView(entry: entry)
                .containerBackground(
                    LinearGradient(
                        colors: [
                            Color(red: 0.07, green: 0.06, blue: 0.18),
                            Color(red: 0.10, green: 0.08, blue: 0.24),
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    ),
                    for: .widget
                )
        }
        .configurationDisplayName("Kaleidoscope")
        .description("Capture and revisit your dreams.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

// MARK: - Preview

#Preview(as: .systemSmall) {
    DreamWidget()
} timeline: {
    DreamEntry(date: .now, snapshot: WidgetSnapshot(
        version: 1,
        state: "insight",
        title: "3-day streak",
        subtitle: "Keep the thread alive",
        meta: "2 entries this week",
        primaryAction: WidgetAction(label: "Capture dream", url: "dreamapp://capture"),
        secondaryAction: WidgetAction(label: "Memory", url: "dreamapp://memory"),
        lastDream: WidgetLastDream(id: "1", title: "Falling into a glass ocean", date: "2026-03-19")
    ))
    DreamEntry(date: .now, snapshot: nil)
}

#Preview(as: .systemMedium) {
    DreamWidget()
} timeline: {
    DreamEntry(date: .now, snapshot: WidgetSnapshot(
        version: 1,
        state: "draft",
        title: "Continue your draft",
        subtitle: "You left off mid-thought",
        meta: "Draft in progress",
        primaryAction: WidgetAction(label: "Resume draft", url: "dreamapp://draft"),
        secondaryAction: WidgetAction(label: "New entry", url: "dreamapp://capture"),
        lastDream: nil
    ))
}

// MARK: - Last Dream Widget

struct DreamLastDreamEntryView: View {
    var entry: DreamEntry

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text("Last dream".uppercased())
                .font(.system(size: 10, weight: .bold))
                .foregroundStyle(.white.opacity(0.45))
                .tracking(0.6)

            Spacer(minLength: 8)

            if let lastDream = entry.snapshot?.lastDream {
                Text(lastDream.title.isEmpty ? "Untitled" : lastDream.title)
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(.white)
                    .lineLimit(4)
                    .fixedSize(horizontal: false, vertical: true)
            } else {
                Text("No dreams yet")
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(.white.opacity(0.7))
                Text("Capture your first dream")
                    .font(.system(size: 12, weight: .regular))
                    .foregroundStyle(.white.opacity(0.5))
                    .padding(.top, 4)
            }

            Spacer(minLength: 0)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .widgetURL(
            entry.snapshot?.lastDream.flatMap { URL(string: "dreamapp://dream/\($0.id)") }
            ?? URL(string: "dreamapp://capture")
        )
    }
}

struct DreamLastDreamWidget: Widget {
    let kind: String = "DreamLastDreamWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: DreamProvider()) { entry in
            DreamLastDreamEntryView(entry: entry)
                .containerBackground(
                    LinearGradient(
                        colors: [
                            Color(red: 0.07, green: 0.06, blue: 0.18),
                            Color(red: 0.10, green: 0.08, blue: 0.24),
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    ),
                    for: .widget
                )
        }
        .configurationDisplayName("Last Dream")
        .description("Quickly revisit your most recent dream.")
        .supportedFamilies([.systemSmall])
    }
}

#Preview(as: .systemSmall) {
    DreamLastDreamWidget()
} timeline: {
    DreamEntry(date: .now, snapshot: WidgetSnapshot(
        version: 1,
        state: "insight",
        title: "3-day streak",
        subtitle: "Keep the thread alive",
        meta: "2 entries this week",
        primaryAction: WidgetAction(label: "Capture dream", url: "dreamapp://capture"),
        secondaryAction: WidgetAction(label: "Memory", url: "dreamapp://memory"),
        lastDream: WidgetLastDream(id: "abc", title: "Falling into a glass ocean", date: "2026-03-19")
    ))
    DreamEntry(date: .now, snapshot: nil)
}
