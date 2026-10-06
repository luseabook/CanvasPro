import { spawn } from 'node:child_process';
import { APP_WINDOW_MIN_HEIGHT, APP_WINDOW_MIN_WIDTH } from './appWindowSizePolicy.js';
const WINDOWS_CHROME_SHELL_IDENTITY_TIMEOUT_MS = 6000;
export function configureWindowsTaskbarIdentity({
  window: targetWindow,
  platform: platform = process.platform,
  appId: appId,
  iconPath: iconPath,
  executablePath: executablePath,
  displayName: displayName,
} = {}) {
  if (
    platform !== 'win32' ||
    typeof targetWindow?.setIcon !== 'function' ||
    typeof targetWindow?.setAppDetails !== 'function'
  )
    return false;
  if (!appId || !iconPath || !executablePath || !displayName) return false;
  try {
    return (
      targetWindow.setIcon(iconPath),
      targetWindow.setAppDetails({
        appId: appId,
        appIconPath: iconPath,
        appIconIndex: 0,
        relaunchCommand: executablePath,
        relaunchDisplayName: displayName,
      }),
      true
    );
  } catch {
    return false;
  }
}
export function installWindowsTaskbarIdentity(options = {}) {
  const { window: targetWindow, platform: platform = process.platform } = options;
  if (
    platform !== 'win32' ||
    typeof targetWindow?.on !== 'function' ||
    typeof targetWindow?.setIcon !== 'function' ||
    typeof targetWindow?.setAppDetails !== 'function'
  )
    return false;
  const applyIdentity = () => configureWindowsTaskbarIdentity({ ...options, platform: platform });
  return (applyIdentity(), targetWindow.on('show', applyIdentity), true);
}
function encodePowerShellValue(value) {
  return Buffer.from(String(value || ''), 'utf8').toString('base64');
}
function readPositiveInteger(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : 0;
}
function readNonNegativeInteger(value, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return Math.round(parsed);
}
function buildWindowsChromeShellTaskbarIdentityScriptInternal({
  browserPath: browserPath,
  profileDir: profileDir,
  appId: appId,
  iconPath: iconPath,
  executablePath: executablePath,
  displayName: displayName,
  sizeGuardDllPath: sizeGuardDllPath,
  minWidth: minWidth = APP_WINDOW_MIN_WIDTH,
  minHeight: minHeight = APP_WINDOW_MIN_HEIGHT,
  timeoutMs: timeoutMs = WINDOWS_CHROME_SHELL_IDENTITY_TIMEOUT_MS,
} = {}) {
  if (
    !browserPath ||
    !profileDir ||
    !appId ||
    !iconPath ||
    !executablePath ||
    !displayName ||
    !sizeGuardDllPath
  )
    return '';
  const resolvedTimeoutMs = readNonNegativeInteger(timeoutMs, WINDOWS_CHROME_SHELL_IDENTITY_TIMEOUT_MS),
    resolvedMinWidth = readPositiveInteger(minWidth) || APP_WINDOW_MIN_WIDTH,
    resolvedMinHeight = readPositiveInteger(minHeight) || APP_WINDOW_MIN_HEIGHT;
  return ('\n$timeoutMs = ' +
    resolvedTimeoutMs +
    '\n$minimumWidth = ' +
    resolvedMinWidth +
    '\n$minimumHeight = ' +
    resolvedMinHeight +
    '\nfunction Decode-TaskbarIdentityValue([string]$encodedValue) {\n  return [System.Text.Encoding]::UTF8.GetString(\n    [System.Convert]::FromBase64String($encodedValue)\n  )\n}\n$browserPath = Decode-TaskbarIdentityValue "' +
    encodePowerShellValue(browserPath) +
    '"\n$profileDir = Decode-TaskbarIdentityValue "' +
    encodePowerShellValue(profileDir) +
    '"\n$appId = Decode-TaskbarIdentityValue "' +
    encodePowerShellValue(appId) +
    '"\n$iconPath = Decode-TaskbarIdentityValue "' +
    encodePowerShellValue(iconPath) +
    '"\n$executablePath = Decode-TaskbarIdentityValue "' +
    encodePowerShellValue(executablePath) +
    '"\n$displayName = Decode-TaskbarIdentityValue "' +
    encodePowerShellValue(displayName) +
    '"\n$sizeGuardDllPath = Decode-TaskbarIdentityValue "' +
    encodePowerShellValue(sizeGuardDllPath) +
    '"\n$relaunchCommand = \'"\' + $executablePath + \'"\'\n$relaunchIconResource = $iconPath + \',0\'\n$profileSwitch = \'--user-data-dir=\' + $profileDir\n$browserName = [System.IO.Path]::GetFileName($browserPath)\n$browserPathIsRooted = [System.IO.Path]::IsPathRooted($browserPath)\n$typeDefinition = @\'\nusing System;\nusing System.Collections.Concurrent;\nusing System.Collections.Generic;\nusing System.Runtime.InteropServices;\nusing System.Text;\n\nnamespace ShuoCanvas {\n  [StructLayout(LayoutKind.Sequential, Pack = 4)]\n  public struct PropertyKey {\n    public Guid formatId;\n    public UInt32 propertyId;\n\n    public PropertyKey(Guid formatId, UInt32 propertyId) {\n      this.formatId = formatId;\n      this.propertyId = propertyId;\n    }\n  }\n\n  [StructLayout(LayoutKind.Explicit, Size = 24)]\n  public struct PropVariant {\n    [FieldOffset(0)]\n    public UInt16 valueType;\n\n    [FieldOffset(8)]\n    public IntPtr pointerValue;\n  }\n\n  [ComImport]\n  [Guid("886D8EEB-8CF2-4446-8D02-CDBA1DBDCF99")]\n  [InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]\n  public interface IPropertyStore {\n    [PreserveSig]\n    Int32 GetCount(out UInt32 propertyCount);\n\n    [PreserveSig]\n    Int32 GetAt(UInt32 propertyIndex, out PropertyKey key);\n\n    [PreserveSig]\n    Int32 GetValue(ref PropertyKey key, out PropVariant value);\n\n    [PreserveSig]\n    Int32 SetValue(ref PropertyKey key, ref PropVariant value);\n\n    [PreserveSig]\n    Int32 Commit();\n  }\n\n  public static class ChromeShellTaskbarIdentity {\n    public delegate bool EnumWindowsProc(IntPtr windowHandle, IntPtr parameter);\n    private delegate void WinEventDelegate(\n      IntPtr hook,\n      UInt32 eventType,\n      IntPtr windowHandle,\n      Int32 objectId,\n      Int32 childId,\n      UInt32 eventThread,\n      UInt32 eventTime\n    );\n\n    [DllImport("user32.dll")]\n    [return: MarshalAs(UnmanagedType.Bool)]\n    public static extern bool EnumWindows(EnumWindowsProc callback, IntPtr parameter);\n\n    [DllImport("user32.dll")]\n    public static extern UInt32 GetWindowThreadProcessId(\n      IntPtr windowHandle,\n      out UInt32 processId\n    );\n\n    [DllImport("user32.dll")]\n    [return: MarshalAs(UnmanagedType.Bool)]\n    public static extern bool IsWindowVisible(IntPtr windowHandle);\n\n    [DllImport("user32.dll")]\n    private static extern bool IsWindow(IntPtr windowHandle);\n\n    [DllImport("user32.dll")]\n    private static extern IntPtr GetAncestor(IntPtr windowHandle, UInt32 flags);\n\n    [DllImport("user32.dll")]\n    private static extern IntPtr GetWindow(IntPtr windowHandle, UInt32 command);\n\n    [DllImport("user32.dll", CharSet = CharSet.Unicode)]\n    private static extern IntPtr LoadImage(\n      IntPtr instance,\n      string name,\n      UInt32 type,\n      Int32 width,\n      Int32 height,\n      UInt32 loadFlags\n    );\n\n    [DllImport("user32.dll", CharSet = CharSet.Auto)]\n    private static extern IntPtr SendMessageTimeout(\n      IntPtr windowHandle,\n      UInt32 message,\n      UIntPtr wParam,\n      IntPtr lParam,\n      UInt32 flags,\n      UInt32 timeout,\n      out UIntPtr result\n    );\n\n    [DllImport("user32.dll", CharSet = CharSet.Unicode)]\n    public static extern Int32 GetWindowText(\n      IntPtr windowHandle,\n      StringBuilder text,\n      Int32 count\n    );\n\n    [DllImport("user32.dll")]\n    public static extern Int32 GetWindowTextLength(IntPtr windowHandle);\n\n    [DllImport("user32.dll")]\n    [return: MarshalAs(UnmanagedType.Bool)]\n    public static extern bool GetWindowRect(IntPtr windowHandle, out WindowRect rect);\n\n    [DllImport("user32.dll")]\n    private static extern UInt32 GetDpiForWindow(IntPtr windowHandle);\n\n    [DllImport("user32.dll")]\n    private static extern IntPtr MonitorFromWindow(\n      IntPtr windowHandle,\n      UInt32 flags\n    );\n\n    [DllImport("user32.dll", CharSet = CharSet.Unicode)]\n    [return: MarshalAs(UnmanagedType.Bool)]\n    private static extern bool GetMonitorInfo(\n      IntPtr monitorHandle,\n      ref MonitorInfo monitorInfo\n    );\n\n    [DllImport("user32.dll")]\n    [return: MarshalAs(UnmanagedType.Bool)]\n    private static extern bool SetProcessDpiAwarenessContext(IntPtr dpiContext);\n\n    [DllImport("user32.dll", CharSet = CharSet.Unicode, SetLastError = true)]\n    [return: MarshalAs(UnmanagedType.Bool)]\n    private static extern bool SetProp(\n      IntPtr windowHandle,\n      string propertyName,\n      IntPtr data\n    );\n\n    [DllImport("user32.dll", CharSet = CharSet.Unicode)]\n    private static extern IntPtr RemoveProp(\n      IntPtr windowHandle,\n      string propertyName\n    );\n\n    [DllImport("user32.dll", SetLastError = true)]\n    private static extern IntPtr SetWindowsHookEx(\n      Int32 hookType,\n      IntPtr hookProcedure,\n      IntPtr hookModule,\n      UInt32 threadId\n    );\n\n    [DllImport("user32.dll")]\n    [return: MarshalAs(UnmanagedType.Bool)]\n    private static extern bool UnhookWindowsHookEx(IntPtr hook);\n\n    [DllImport("user32.dll", CharSet = CharSet.Unicode)]\n    private static extern UInt32 RegisterWindowMessage(string messageName);\n\n    [DllImport("kernel32.dll", CharSet = CharSet.Unicode, SetLastError = true)]\n    private static extern IntPtr LoadLibrary(string fileName);\n\n    [DllImport(\n      "kernel32.dll",\n      CharSet = CharSet.Ansi,\n      ExactSpelling = true,\n      SetLastError = true\n    )]\n    private static extern IntPtr GetProcAddress(IntPtr module, string procedureName);\n\n    [DllImport("kernel32.dll")]\n    [return: MarshalAs(UnmanagedType.Bool)]\n    private static extern bool FreeLibrary(IntPtr module);\n\n    [StructLayout(LayoutKind.Sequential)]\n    public struct WindowRect {\n      public Int32 left;\n      public Int32 top;\n      public Int32 right;\n      public Int32 bottom;\n    }\n\n    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]\n    private struct MonitorInfo {\n      public UInt32 size;\n      public WindowRect monitor;\n      public WindowRect workArea;\n      public UInt32 flags;\n    }\n\n    [StructLayout(LayoutKind.Sequential)]\n    private struct Message {\n      public IntPtr windowHandle;\n      public UInt32 message;\n      public UIntPtr wParam;\n      public IntPtr lParam;\n      public UInt32 time;\n      public Int32 x;\n      public Int32 y;\n    }\n\n    [DllImport("user32.dll")]\n    private static extern IntPtr SetWinEventHook(\n      UInt32 eventMin,\n      UInt32 eventMax,\n      IntPtr eventHookModule,\n      WinEventDelegate callback,\n      UInt32 processId,\n      UInt32 threadId,\n      UInt32 flags\n    );\n\n    [DllImport("user32.dll")]\n    [return: MarshalAs(UnmanagedType.Bool)]\n    private static extern bool UnhookWinEvent(IntPtr hook);\n\n    [DllImport("user32.dll")]\n    [return: MarshalAs(UnmanagedType.Bool)]\n    private static extern bool PeekMessage(\n      out Message message,\n      IntPtr windowHandle,\n      UInt32 messageFilterMin,\n      UInt32 messageFilterMax,\n      UInt32 removeMessage\n    );\n\n    [DllImport("user32.dll")]\n    [return: MarshalAs(UnmanagedType.Bool)]\n    private static extern bool TranslateMessage(ref Message message);\n\n    [DllImport("user32.dll")]\n    private static extern IntPtr DispatchMessage(ref Message message);\n\n    [DllImport("shell32.dll", PreserveSig = true)]\n    private static extern Int32 SHGetPropertyStoreForWindow(\n      IntPtr windowHandle,\n      ref Guid interfaceId,\n      [MarshalAs(UnmanagedType.Interface)] out IPropertyStore propertyStore\n    );\n\n    [DllImport("ole32.dll", PreserveSig = true)]\n    private static extern Int32 PropVariantClear(ref PropVariant propVariant);\n\n    private static readonly Guid AppUserModelFormatId =\n      new Guid("9F4C2855-9F79-4B39-A8D0-E1D42DE1D5F3");\n    private const UInt32 RelaunchCommandPropertyId = 2;\n    private const UInt32 RelaunchIconResourcePropertyId = 3;\n    private const UInt32 RelaunchDisplayNameResourcePropertyId = 4;\n    private const UInt32 AppUserModelIdPropertyId = 5;\n    private const UInt16 VariantTypeUnicodeString = 31;\n    private const UInt32 EventObjectCreate = 0x8000;\n    private const UInt32 EventObjectDestroy = 0x8001;\n    private const UInt32 EventObjectShow = 0x8002;\n    private const UInt32 WineventOutOfContext = 0;\n    private const Int32 ObjectIdWindow = 0;\n    private const Int32 WhCallWndProc = 4;\n    private const UInt32 GetAncestorRoot = 2;\n    private const UInt32 GetWindowOwner = 4;\n    private const UInt32 MonitorDefaultToNearest = 2;\n    private const UInt32 PeekMessageRemove = 1;\n    private const UInt32 DefaultDpi = 96;\n    private const UInt32 ImageIcon = 1;\n    private const UInt32 LoadIconFromFile = 0x10;\n    private const UInt32 LoadIconDefaultSize = 0x40;\n    private const UInt32 LoadIconShared = 0x8000;\n    private const UInt32 WindowMessageSetIcon = 0x80;\n    private const UInt32 WindowMessageNull = 0x0000;\n    private const UInt32 IconSmall = 0;\n    private const UInt32 IconBig = 1;\n    private const UInt32 SendMessageAbortIfHung = 0x2;\n    private static readonly object CandidateProcessLock = new object();\n    private static readonly HashSet<UInt32> CandidateProcessIds =\n      new HashSet<UInt32>();\n    private static readonly ConcurrentQueue<IntPtr> ObservedWindows =\n      new ConcurrentQueue<IntPtr>();\n    private static readonly ConcurrentDictionary<UInt32, IntPtr> MinimumSizeHooks =\n      new ConcurrentDictionary<UInt32, IntPtr>();\n    private static readonly ConcurrentDictionary<IntPtr, byte> GuardedWindows =\n      new ConcurrentDictionary<IntPtr, byte>();\n    private static readonly WinEventDelegate WindowEventCallback =\n      HandleWindowEvent;\n    private static IntPtr windowEventHook = IntPtr.Zero;\n    private static IntPtr sizeGuardModule = IntPtr.Zero;\n    private static IntPtr sizeGuardProcedure = IntPtr.Zero;\n    private static string configuredAppId = "";\n    private static string configuredRelaunchCommand = "";\n    private static string configuredDisplayName = "";\n    private static string configuredIconResource = "";\n    private static IntPtr configuredIconHandle = IntPtr.Zero;\n    private static Int32 configuredMinimumWidth = 0;\n    private static Int32 configuredMinimumHeight = 0;\n    private static bool usePhysicalPixelCoordinates = false;\n    private const string MinimumWidthPropertyName =\n      "SHUO.Canvas.MinimumTrackWidth.v1";\n    private const string MinimumHeightPropertyName =\n      "SHUO.Canvas.MinimumTrackHeight.v1";\n    private const string RemoveMinimumSizeSubclassMessageName =\n      "SHUO.Canvas.RemoveMinimumTrackSizeSubclass.v1";\n\n    private static void SetString(\n      IPropertyStore propertyStore,\n      UInt32 propertyId,\n      string value\n    ) {\n      PropVariant propVariant = new PropVariant();\n      propVariant.valueType = VariantTypeUnicodeString;\n      propVariant.pointerValue = Marshal.StringToCoTaskMemUni(value);\n      try {\n        PropertyKey key = new PropertyKey(AppUserModelFormatId, propertyId);\n        Int32 result = propertyStore.SetValue(ref key, ref propVariant);\n        Marshal.ThrowExceptionForHR(result);\n      } finally {\n        PropVariantClear(ref propVariant);\n      }\n    }\n\n    private static void Apply(\n      IntPtr windowHandle,\n      string appId,\n      string relaunchCommand,\n      string displayName,\n      string relaunchIconResource\n    ) {\n      Guid interfaceId = new Guid("886D8EEB-8CF2-4446-8D02-CDBA1DBDCF99");\n      IPropertyStore propertyStore = null;\n      Int32 result = SHGetPropertyStoreForWindow(\n        windowHandle,\n        ref interfaceId,\n        out propertyStore\n      );\n      Marshal.ThrowExceptionForHR(result);\n      try {\n        SetString(propertyStore, RelaunchCommandPropertyId, relaunchCommand);\n        SetString(\n          propertyStore,\n          RelaunchDisplayNameResourcePropertyId,\n          displayName\n        );\n        SetString(\n          propertyStore,\n          RelaunchIconResourcePropertyId,\n          relaunchIconResource\n        );\n        SetString(propertyStore, AppUserModelIdPropertyId, appId);\n      } finally {\n        if (propertyStore != null && Marshal.IsComObject(propertyStore)) {\n          Marshal.FinalReleaseComObject(propertyStore);\n        }\n      }\n    }\n\n    public static void Configure(\n      string appId,\n      string relaunchCommand,\n      string displayName,\n      string relaunchIconResource,\n      string iconPath,\n      string sizeGuardDllPath,\n      Int32 minimumWidth,\n      Int32 minimumHeight\n    ) {\n      try {\n        usePhysicalPixelCoordinates = SetProcessDpiAwarenessContext(\n          new IntPtr(-4)\n        );\n      } catch {\n        usePhysicalPixelCoordinates = false;\n      }\n      configuredAppId = appId;\n      configuredRelaunchCommand = relaunchCommand;\n      configuredDisplayName = displayName;\n      configuredIconResource = relaunchIconResource;\n      configuredMinimumWidth = Math.Max(1, minimumWidth);\n      configuredMinimumHeight = Math.Max(1, minimumHeight);\n      sizeGuardModule = LoadLibrary(sizeGuardDllPath);\n      if (sizeGuardModule != IntPtr.Zero) {\n        sizeGuardProcedure = GetProcAddress(\n          sizeGuardModule,\n          "ShuoCanvasCallWndProcHookProc"\n        );\n        if (sizeGuardProcedure == IntPtr.Zero) {\n          FreeLibrary(sizeGuardModule);\n          sizeGuardModule = IntPtr.Zero;\n        }\n      }\n      configuredIconHandle = LoadImage(\n        IntPtr.Zero,\n        iconPath,\n        ImageIcon,\n        0,\n        0,\n        LoadIconFromFile | LoadIconDefaultSize | LoadIconShared\n      );\n    }\n\n    public static bool IsMinimumSizeGuardReady() {\n      return sizeGuardModule != IntPtr.Zero\n        && sizeGuardProcedure != IntPtr.Zero;\n    }\n\n    public static void AddCandidateProcessId(UInt32 processId) {\n      if (processId == 0) return;\n      lock (CandidateProcessLock) {\n        CandidateProcessIds.Add(processId);\n      }\n    }\n\n    private static bool IsCandidateProcess(UInt32 processId) {\n      lock (CandidateProcessLock) {\n        return CandidateProcessIds.Contains(processId);\n      }\n    }\n\n    private static bool IsTopLevelCandidateWindow(IntPtr windowHandle) {\n      if (windowHandle == IntPtr.Zero || !IsWindow(windowHandle)) return false;\n      if (GetAncestor(windowHandle, GetAncestorRoot) != windowHandle) return false;\n      if (GetWindow(windowHandle, GetWindowOwner) != IntPtr.Zero) return false;\n      UInt32 processId;\n      GetWindowThreadProcessId(windowHandle, out processId);\n      return IsCandidateProcess(processId);\n    }\n\n    private static string ReadWindowTitle(IntPtr windowHandle) {\n      Int32 titleLength = GetWindowTextLength(windowHandle);\n      if (titleLength <= 0) return "";\n      StringBuilder title = new StringBuilder(Math.Max(256, titleLength + 1));\n      GetWindowText(windowHandle, title, title.Capacity);\n      return title.ToString();\n    }\n\n    private static bool IsBrandedAppWindow(IntPtr windowHandle) {\n      string title = ReadWindowTitle(windowHandle);\n      return title.IndexOf("updream canvas", StringComparison.OrdinalIgnoreCase) >= 0\n        || title.IndexOf("AI CanvasPro", StringComparison.OrdinalIgnoreCase) >= 0\n        || title.IndexOf("AI Canvas", StringComparison.OrdinalIgnoreCase) >= 0;\n    }\n\n    private static bool LooksLikeVisibleAppWindow(IntPtr windowHandle) {\n      if (!IsWindowVisible(windowHandle)) return false;\n      WindowRect rect;\n      if (!GetWindowRect(windowHandle, out rect)) return false;\n      Int32 width = rect.right - rect.left;\n      Int32 height = rect.bottom - rect.top;\n      if (width <= 0 || height <= 0) return false;\n      return IsBrandedAppWindow(windowHandle)\n        || (width > 300 && height > 300 && GetWindowTextLength(windowHandle) > 0);\n    }\n\n    private static Int32 ScaleMinimumForWindow(\n      IntPtr windowHandle,\n      Int32 minimumDip\n    ) {\n      if (!usePhysicalPixelCoordinates) return minimumDip;\n      UInt32 dpi = DefaultDpi;\n      try {\n        dpi = GetDpiForWindow(windowHandle);\n      } catch {\n        dpi = DefaultDpi;\n      }\n      if (dpi == 0) dpi = DefaultDpi;\n      Int64 scaled = ((Int64)minimumDip * dpi + DefaultDpi - 1) / DefaultDpi;\n      return (Int32)Math.Min(Int32.MaxValue, Math.Max(1, scaled));\n    }\n\n    private static bool InstallMinimumSizeGuard(IntPtr windowHandle) {\n      if (!IsTopLevelCandidateWindow(windowHandle)) return false;\n      if (!IsBrandedAppWindow(windowHandle)) return false;\n      if (!IsMinimumSizeGuardReady()) return false;\n\n      Int32 minimumWidth = ScaleMinimumForWindow(\n        windowHandle,\n        configuredMinimumWidth\n      );\n      Int32 minimumHeight = ScaleMinimumForWindow(\n        windowHandle,\n        configuredMinimumHeight\n      );\n      IntPtr monitorHandle = MonitorFromWindow(\n        windowHandle,\n        MonitorDefaultToNearest\n      );\n      if (monitorHandle != IntPtr.Zero) {\n        MonitorInfo monitorInfo = new MonitorInfo();\n        monitorInfo.size = (UInt32)Marshal.SizeOf(typeof(MonitorInfo));\n        if (GetMonitorInfo(monitorHandle, ref monitorInfo)) {\n          Int32 workAreaWidth = monitorInfo.workArea.right - monitorInfo.workArea.left;\n          Int32 workAreaHeight = monitorInfo.workArea.bottom - monitorInfo.workArea.top;\n          if (workAreaWidth > 0) minimumWidth = Math.Min(minimumWidth, workAreaWidth);\n          if (workAreaHeight > 0) minimumHeight = Math.Min(minimumHeight, workAreaHeight);\n        }\n      }\n\n      if (\n        !SetProp(\n          windowHandle,\n          MinimumWidthPropertyName,\n          new IntPtr(minimumWidth)\n        )\n        || !SetProp(\n          windowHandle,\n          MinimumHeightPropertyName,\n          new IntPtr(minimumHeight)\n        )\n      ) {\n        RemoveProp(windowHandle, MinimumWidthPropertyName);\n        RemoveProp(windowHandle, MinimumHeightPropertyName);\n        return false;\n      }\n\n      UInt32 processId;\n      UInt32 threadId = GetWindowThreadProcessId(windowHandle, out processId);\n      if (threadId == 0) {\n        RemoveProp(windowHandle, MinimumWidthPropertyName);\n        RemoveProp(windowHandle, MinimumHeightPropertyName);\n        return false;\n      }\n\n      IntPtr existingHook;\n      if (!MinimumSizeHooks.TryGetValue(threadId, out existingHook)) {\n        IntPtr hook = SetWindowsHookEx(\n          WhCallWndProc,\n          sizeGuardProcedure,\n          sizeGuardModule,\n          threadId\n        );\n        if (hook == IntPtr.Zero) {\n          RemoveProp(windowHandle, MinimumWidthPropertyName);\n          RemoveProp(windowHandle, MinimumHeightPropertyName);\n          return false;\n        }\n        if (!MinimumSizeHooks.TryAdd(threadId, hook)) {\n          UnhookWindowsHookEx(hook);\n        }\n      }\n      GuardedWindows[windowHandle] = 0;\n      UIntPtr messageResult;\n      SendMessageTimeout(\n        windowHandle,\n        WindowMessageNull,\n        UIntPtr.Zero,\n        IntPtr.Zero,\n        SendMessageAbortIfHung,\n        100,\n        out messageResult\n      );\n      return true;\n    }\n\n    private static bool TryApply(IntPtr windowHandle, bool requireVisibleApp) {\n      if (!IsTopLevelCandidateWindow(windowHandle)) return false;\n      if (requireVisibleApp && !LooksLikeVisibleAppWindow(windowHandle)) {\n        return false;\n      }\n      bool iconApplied = false;\n      if (configuredIconHandle != IntPtr.Zero) {\n        UIntPtr messageResult;\n        SendMessageTimeout(\n          windowHandle,\n          WindowMessageSetIcon,\n          new UIntPtr(IconBig),\n          configuredIconHandle,\n          SendMessageAbortIfHung,\n          100,\n          out messageResult\n        );\n        SendMessageTimeout(\n          windowHandle,\n          WindowMessageSetIcon,\n          new UIntPtr(IconSmall),\n          configuredIconHandle,\n          SendMessageAbortIfHung,\n          100,\n          out messageResult\n        );\n        iconApplied = true;\n      }\n      try {\n        Apply(\n          windowHandle,\n          configuredAppId,\n          configuredRelaunchCommand,\n          configuredDisplayName,\n          configuredIconResource\n        );\n        return true;\n      } catch {\n        return iconApplied;\n      }\n    }\n\n    private static void HandleWindowEvent(\n      IntPtr hook,\n      UInt32 eventType,\n      IntPtr windowHandle,\n      Int32 objectId,\n      Int32 childId,\n      UInt32 eventThread,\n      UInt32 eventTime\n    ) {\n      if (\n        objectId != ObjectIdWindow\n        || childId != 0\n        || windowHandle == IntPtr.Zero\n      ) {\n        return;\n      }\n      if (eventType == EventObjectDestroy) {\n        byte removed;\n        GuardedWindows.TryRemove(windowHandle, out removed);\n        return;\n      }\n      ObservedWindows.Enqueue(windowHandle);\n      TryApply(windowHandle, false);\n      InstallMinimumSizeGuard(windowHandle);\n    }\n\n    public static bool StartWatching() {\n      if (windowEventHook != IntPtr.Zero) return true;\n      windowEventHook = SetWinEventHook(\n        EventObjectCreate,\n        EventObjectShow,\n        IntPtr.Zero,\n        WindowEventCallback,\n        0,\n        0,\n        WineventOutOfContext\n      );\n      return windowEventHook != IntPtr.Zero;\n    }\n\n    public static void StopWatching() {\n      if (windowEventHook != IntPtr.Zero) {\n        UnhookWinEvent(windowEventHook);\n        windowEventHook = IntPtr.Zero;\n      }\n      UInt32 removeSubclassMessage = RegisterWindowMessage(\n        RemoveMinimumSizeSubclassMessageName\n      );\n      if (removeSubclassMessage != 0) {\n        foreach (KeyValuePair<IntPtr, byte> entry in GuardedWindows) {\n          if (!IsWindow(entry.Key)) continue;\n          UIntPtr messageResult;\n          SendMessageTimeout(\n            entry.Key,\n            removeSubclassMessage,\n            UIntPtr.Zero,\n            IntPtr.Zero,\n            SendMessageAbortIfHung,\n            100,\n            out messageResult\n          );\n        }\n      }\n      foreach (KeyValuePair<UInt32, IntPtr> entry in MinimumSizeHooks) {\n        if (entry.Value != IntPtr.Zero) UnhookWindowsHookEx(entry.Value);\n      }\n      MinimumSizeHooks.Clear();\n      foreach (KeyValuePair<IntPtr, byte> entry in GuardedWindows) {\n        if (!IsWindow(entry.Key)) continue;\n        RemoveProp(entry.Key, MinimumWidthPropertyName);\n        RemoveProp(entry.Key, MinimumHeightPropertyName);\n      }\n      GuardedWindows.Clear();\n      if (sizeGuardModule != IntPtr.Zero) {\n        FreeLibrary(sizeGuardModule);\n        sizeGuardModule = IntPtr.Zero;\n        sizeGuardProcedure = IntPtr.Zero;\n      }\n    }\n\n    public static void PumpMessages() {\n      Message message;\n      while (\n        PeekMessage(\n          out message,\n          IntPtr.Zero,\n          0,\n          0,\n          PeekMessageRemove\n        )\n      ) {\n        TranslateMessage(ref message);\n        DispatchMessage(ref message);\n      }\n      IntPtr observedWindow;\n      while (ObservedWindows.TryDequeue(out observedWindow)) {\n        TryApply(observedWindow, false);\n        InstallMinimumSizeGuard(observedWindow);\n      }\n    }\n\n    public static bool ApplyVisibleCandidateWindows() {\n      bool appWindowPrepared = false;\n      EnumWindows(delegate(IntPtr windowHandle, IntPtr parameter) {\n        TryApply(windowHandle, true);\n        if (InstallMinimumSizeGuard(windowHandle)) appWindowPrepared = true;\n        return true;\n      }, IntPtr.Zero);\n      return appWindowPrepared;\n    }\n\n    public static bool MaintainVisibleCandidateWindowGuards() {\n      bool appWindowFound = false;\n      EnumWindows(delegate(IntPtr windowHandle, IntPtr parameter) {\n        if (InstallMinimumSizeGuard(windowHandle)) appWindowFound = true;\n        return true;\n      }, IntPtr.Zero);\n      return appWindowFound;\n    }\n\n  }\n}\n\'@\nAdd-Type -TypeDefinition $typeDefinition -ErrorAction Stop\nfunction Register-TaskbarIdentityBrowserProcesses {\n  try {\n    $escapedBrowserName = $browserName.Replace("\'", "\'\'")\n    $browserProcesses = Get-CimInstance Win32_Process -Filter "Name = \'$escapedBrowserName\'" -ErrorAction Stop\n    foreach ($browserProcess in $browserProcesses) {\n      $matchesExecutable = -not $browserPathIsRooted -or [string]::Equals(\n        [string]$browserProcess.ExecutablePath,\n        $browserPath,\n        [StringComparison]::OrdinalIgnoreCase\n      )\n      $commandLine = [string]$browserProcess.CommandLine\n      $matchesProfile = $commandLine.IndexOf(\n        $profileSwitch,\n        [StringComparison]::OrdinalIgnoreCase\n      ) -ge 0\n      if ($matchesExecutable -and $matchesProfile) {\n        [ShuoCanvas.ChromeShellTaskbarIdentity]::AddCandidateProcessId(\n          [uint32]$browserProcess.ProcessId\n        )\n      }\n    }\n  } catch {}\n}\n[ShuoCanvas.ChromeShellTaskbarIdentity]::Configure(\n  $appId,\n  $relaunchCommand,\n  $displayName,\n  $relaunchIconResource,\n  $iconPath,\n  $sizeGuardDllPath,\n  $minimumWidth,\n  $minimumHeight\n)\nif (-not [ShuoCanvas.ChromeShellTaskbarIdentity]::IsMinimumSizeGuardReady()) {\n  exit 5\n}\nRegister-TaskbarIdentityBrowserProcesses\nif (-not [ShuoCanvas.ChromeShellTaskbarIdentity]::StartWatching()) {\n  exit 3\n}\ntry {\n  [Console]::Out.WriteLine(\'READY\')\n  [Console]::Out.Flush()\n  $targetPid = [int][Console]::In.ReadLine()\n  if ($targetPid -le 0) {\n    exit 4\n  }\n  [ShuoCanvas.ChromeShellTaskbarIdentity]::AddCandidateProcessId(\n    [uint32]$targetPid\n  )\n  $deadline = [DateTime]::UtcNow.AddMilliseconds($timeoutMs)\n  $nextProcessRefresh = [DateTime]::UtcNow.AddMilliseconds(500)\n  $stableDeadline = $null\n  $minimumSizeGuardStarted = $false\n  while ([DateTime]::UtcNow -le $deadline) {\n    [ShuoCanvas.ChromeShellTaskbarIdentity]::PumpMessages()\n    if ($null -eq $stableDeadline -and [DateTime]::UtcNow -ge $nextProcessRefresh) {\n      Register-TaskbarIdentityBrowserProcesses\n      $nextProcessRefresh = [DateTime]::UtcNow.AddMilliseconds(150)\n    }\n    $visibleIdentityApplied =\n      [ShuoCanvas.ChromeShellTaskbarIdentity]::ApplyVisibleCandidateWindows()\n    if ($visibleIdentityApplied -and $null -eq $stableDeadline) {\n      $stableDeadline = [DateTime]::UtcNow.AddMilliseconds(750)\n    }\n    if ($null -ne $stableDeadline -and [DateTime]::UtcNow -ge $stableDeadline) {\n      $minimumSizeGuardStarted = $true\n      break\n    }\n    Start-Sleep -Milliseconds 15\n  }\n  if (-not $minimumSizeGuardStarted) {\n    exit 2\n  }\n\n  $missingWindowDeadline = $null\n  $nextGuardRefresh = [DateTime]::MinValue\n  while ($true) {\n    [ShuoCanvas.ChromeShellTaskbarIdentity]::PumpMessages()\n    $now = [DateTime]::UtcNow\n    if ($now -ge $nextGuardRefresh) {\n      $appWindowFound =\n        [ShuoCanvas.ChromeShellTaskbarIdentity]::MaintainVisibleCandidateWindowGuards()\n      if ($appWindowFound) {\n        $missingWindowDeadline = $null\n      } elseif ($null -eq $missingWindowDeadline) {\n        $missingWindowDeadline = $now.AddMilliseconds(2000)\n      } elseif ($now -ge $missingWindowDeadline) {\n        exit 0\n      }\n      $nextGuardRefresh = $now.AddMilliseconds(250)\n    }\n    Start-Sleep -Milliseconds 25\n  }\n} finally {\n  [ShuoCanvas.ChromeShellTaskbarIdentity]::StopWatching()\n}\n').trim();
}
export function buildWindowsChromeShellTaskbarIdentityScript(options = {}) {
  const script = buildWindowsChromeShellTaskbarIdentityScriptInternal(options);
  return script.replace(
    'title.IndexOf("AI Canvas", StringComparison.OrdinalIgnoreCase) >= 0;',
    'title.IndexOf("AI Canvas", StringComparison.OrdinalIgnoreCase) >= 0\n        || title.IndexOf("Canvas", StringComparison.OrdinalIgnoreCase) >= 0;',
  );
}
function logTaskbarIdentityFailure(logEvent, type, message, extra = {}) {
  logEvent?.({ type: type, level: 'warn', source: 'main', message: message, ...extra });
}
function waitForTaskbarIdentityHelperReady(helper, timeoutMs = WINDOWS_CHROME_SHELL_IDENTITY_TIMEOUT_MS) {
  return new Promise((resolve) => {
    let settled = false,
      output = '';
    const finish = (ready) => {
        if (settled) return;
        ((settled = true),
          clearTimeout(timer),
          helper?.stdout?.removeListener?.('data', onData),
          helper?.removeListener?.('error', onError),
          helper?.removeListener?.('exit', onExit),
          resolve(ready));
      },
      onData = (chunk) => {
        output += String(chunk || '');
        if (/(^|\r?\n)READY\r?\n/.test(output + '\n')) finish(true);
      },
      onError = () => finish(false),
      onExit = () => finish(false),
      timer = setTimeout(() => finish(false), timeoutMs);
    (timer.unref?.(),
      helper?.stdout?.on?.('data', onData),
      helper?.once?.('error', onError),
      helper?.once?.('exit', onExit));
  });
}
export async function prepareWindowsChromeShellTaskbarIdentity({
  browserPath: browserPath,
  profileDir: profileDir,
  platform: platform = process.platform,
  spawnProcess: spawnProcess = spawn,
  logEvent: logEvent = null,
  ...rest
} = {}) {
  if (platform !== 'win32') return null;
  const script = buildWindowsChromeShellTaskbarIdentityScript({
    browserPath: browserPath,
    profileDir: profileDir,
    ...rest,
  });
  if (!script) return null;
  try {
    const helper = spawnProcess(
        'powershell.exe',
        ['-NoLogo', '-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', script],
        { stdio: ['pipe', 'pipe', 'ignore'], windowsHide: true, detached: false },
      ),
      ready = await waitForTaskbarIdentityHelperReady(helper);
    if (!ready)
      return (
        helper?.kill?.(),
        logTaskbarIdentityFailure(
          logEvent,
          'chrome_shell.taskbar_identity_not_ready',
          'Windows Chrome shell taskbar identity helper was not ready before launch',
        ),
        null
      );
    return (
      helper?.once?.('exit', (code, signal) => {
        if (code === 0) return;
        logTaskbarIdentityFailure(
          logEvent,
          'chrome_shell.taskbar_identity_timeout',
          'Windows Chrome shell taskbar identity was not applied',
          { context: { code: code, signal: signal } },
        );
      }),
      {
        helper: helper,
        cancel() {
          (helper?.stdin?.end?.(), helper?.kill?.());
        },
        attach(launch) {
          const pid = readPositiveInteger(launch?.pid);
          if (!pid || typeof helper?.stdin?.write !== 'function') return (this.cancel(), false);
          return (
            helper.stdin.write(pid + '\n'),
            helper.stdin.end?.(),
            helper.stdout?.destroy?.(),
            helper.unref?.(),
            true
          );
        },
      }
    );
  } catch (error) {
    return (
      logTaskbarIdentityFailure(
        logEvent,
        'chrome_shell.taskbar_identity_spawn_error',
        'Windows Chrome shell taskbar identity helper could not start',
        { error: error },
      ),
      null
    );
  }
}
