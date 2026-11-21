use serde::Serialize;

#[derive(Debug, Serialize)]
struct AppInfo {
    name: &'static str,
    offline_ready: bool,
    runtime_note: &'static str,
}

#[tauri::command]
fn app_info() -> AppInfo {
    AppInfo {
        name: "motionlab",
        offline_ready: true,
        runtime_note: "The packaged build expects a licensed local Cubism Core runtime.",
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![app_info])
        .run(tauri::generate_context!())
        .expect("error while running motionlab");
}
