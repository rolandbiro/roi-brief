import { Font } from "@react-pdf/renderer";

Font.register({
  family: "Archivo",
  fonts: [
    {
      src: "https://fonts.gstatic.com/s/archivo/v25/k3k6o8UDI-1M0wlSV9XAw6lQkqWY8Q82sJaRE-NWIDdgffTTNDNp8A.ttf",
      fontWeight: 400,
    },
    {
      src: "https://fonts.gstatic.com/s/archivo/v25/k3k6o8UDI-1M0wlSV9XAw6lQkqWY8Q82sJaRE-NWIDdgffTT0zRp8A.ttf",
      fontWeight: 700,
    },
    {
      src: "https://fonts.gstatic.com/s/archivo/v25/k3k6o8UDI-1M0wlSV9XAw6lQkqWY8Q82sJaRE-NWIDdgffTTnTRp8A.ttf",
      fontWeight: 900,
    },
  ],
});

Font.registerHyphenationCallback((word) => [word]);
