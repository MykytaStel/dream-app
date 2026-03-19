//
//  DreamWidgetExtensionLiveActivity.swift
//  DreamWidgetExtension
//
//  Created by Mykyta on 19.03.2026.
//

import ActivityKit
import WidgetKit
import SwiftUI

struct DreamWidgetExtensionAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        // Dynamic stateful properties about your activity go here!
        var emoji: String
    }

    // Fixed non-changing properties about your activity go here!
    var name: String
}

struct DreamWidgetExtensionLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: DreamWidgetExtensionAttributes.self) { context in
            // Lock screen/banner UI goes here
            VStack {
                Text("Hello \(context.state.emoji)")
            }
            .activityBackgroundTint(Color.cyan)
            .activitySystemActionForegroundColor(Color.black)

        } dynamicIsland: { context in
            DynamicIsland {
                // Expanded UI goes here.  Compose the expanded UI through
                // various regions, like leading/trailing/center/bottom
                DynamicIslandExpandedRegion(.leading) {
                    Text("Leading")
                }
                DynamicIslandExpandedRegion(.trailing) {
                    Text("Trailing")
                }
                DynamicIslandExpandedRegion(.bottom) {
                    Text("Bottom \(context.state.emoji)")
                    // more content
                }
            } compactLeading: {
                Text("L")
            } compactTrailing: {
                Text("T \(context.state.emoji)")
            } minimal: {
                Text(context.state.emoji)
            }
            .widgetURL(URL(string: "http://www.apple.com"))
            .keylineTint(Color.red)
        }
    }
}

extension DreamWidgetExtensionAttributes {
    fileprivate static var preview: DreamWidgetExtensionAttributes {
        DreamWidgetExtensionAttributes(name: "World")
    }
}

extension DreamWidgetExtensionAttributes.ContentState {
    fileprivate static var smiley: DreamWidgetExtensionAttributes.ContentState {
        DreamWidgetExtensionAttributes.ContentState(emoji: "😀")
     }
     
     fileprivate static var starEyes: DreamWidgetExtensionAttributes.ContentState {
         DreamWidgetExtensionAttributes.ContentState(emoji: "🤩")
     }
}

#Preview("Notification", as: .content, using: DreamWidgetExtensionAttributes.preview) {
   DreamWidgetExtensionLiveActivity()
} contentStates: {
    DreamWidgetExtensionAttributes.ContentState.smiley
    DreamWidgetExtensionAttributes.ContentState.starEyes
}
