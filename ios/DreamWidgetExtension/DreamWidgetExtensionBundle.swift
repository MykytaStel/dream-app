//
//  DreamWidgetExtensionBundle.swift
//  DreamWidgetExtension
//
//  Created by Mykyta on 19.03.2026.
//

import WidgetKit
import SwiftUI

@main
struct DreamWidgetExtensionBundle: WidgetBundle {
    var body: some Widget {
        DreamWidget()
        DreamLastDreamWidget()
        DreamWidgetExtensionControl()
        DreamWidgetExtensionLiveActivity()
    }
}
