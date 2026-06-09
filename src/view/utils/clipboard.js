function copyWithSelectionFallback(text) {
  return new Promise((resolve, reject) => {
    if (typeof document === "undefined" || !document.body) {
      reject(new Error("Clipboard fallback unavailable"));
      return;
    }

    const activeElement = document.activeElement;
    const selection = document.getSelection?.();
    const ranges = [];

    if (selection) {
      for (let index = 0; index < selection.rangeCount; index += 1) {
        ranges.push(selection.getRangeAt(index));
      }
    }

    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.top = "0";
    textarea.style.opacity = "0";

    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    let copied = false;

    try {
      copied = document.execCommand("copy");
    } finally {
      document.body.removeChild(textarea);

      if (selection) {
        selection.removeAllRanges();
        ranges.forEach((range) => selection.addRange(range));
      }

      activeElement?.focus?.();
    }

    if (copied) {
      resolve();
    } else {
      reject(new Error("Clipboard fallback failed"));
    }
  });
}

export function copyToClipboard(value) {
  const text = String(value ?? "");

  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text).catch(() => copyWithSelectionFallback(text));
  }

  return copyWithSelectionFallback(text);
}
