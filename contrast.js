function hexToRgb(hex) {
    let r = 0, g = 0, b = 0;
    if (hex.length === 4) {
      r = "0x" + hex[1] + hex[1];
      g = "0x" + hex[2] + hex[2];
      b = "0x" + hex[3] + hex[3];
    } else if (hex.length === 7) {
      r = "0x" + hex[1] + hex[2];
      g = "0x" + hex[3] + hex[4];
      b = "0x" + hex[5] + hex[6];
    }
    return [parseInt(r), parseInt(g), parseInt(b)];
}

function getLuminance(r, g, b) {
    let a = [r, g, b].map(function (v) {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow( (v + 0.055) / 1.055, 2.4 );
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function contrast(hex1, hex2) {
    let lum1 = getLuminance(...hexToRgb(hex1));
    let lum2 = getLuminance(...hexToRgb(hex2));
    let brightest = Math.max(lum1, lum2);
    let darkest = Math.min(lum1, lum2);
    return (brightest + 0.05) / (darkest + 0.05);
}

console.log("White on primary (#d66543):", contrast("#ffffff", "#d66543"));
console.log("Black on primary (#d66543):", contrast("#000000", "#d66543"));
console.log("#04101e on primary (#d66543):", contrast("#04101e", "#d66543"));
console.log("#1a1a1a on primary (#d66543):", contrast("#1a1a1a", "#d66543"));
console.log("#000000 on hover primary (#ef8b63):", contrast("#000000", "#ef8b63"));
