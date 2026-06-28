import { useEffect } from "react";

interface OgMetaOptions {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
}

/**
 * Dynamically updates Open Graph and Twitter Card <meta> tags in <head>.
 * Restores default values when the component unmounts.
 */
export function useOgMeta(options: OgMetaOptions) {
  useEffect(() => {
    const APP_URL = "https://file-sharing-system-lake.vercel.app";

    const defaults: Required<OgMetaOptions> = {
      title: "ShareVault – Secure File Sharing",
      description:
        "Share files securely with ShareVault. Upload, share, and control access to your files with ease.",
      image: `${APP_URL}/vite.svg`,
      url: APP_URL,
      type: "website",
    };

    const setMeta = (property: string, content: string) => {
      let el = document.querySelector<HTMLMetaElement>(
        `meta[property="${property}"]`
      );
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute("property", property);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    const setNameMeta = (name: string, content: string) => {
      let el = document.querySelector<HTMLMetaElement>(
        `meta[name="${name}"]`
      );
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute("name", name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    const title = options.title ?? defaults.title;
    const description = options.description ?? defaults.description;
    const image = options.image ?? defaults.image;
    const url = options.url ?? defaults.url;
    const type = options.type ?? defaults.type;

    // OG tags
    setMeta("og:title", title);
    setMeta("og:description", description);
    setMeta("og:image", image);
    setMeta("og:url", url);
    setMeta("og:type", type);

    // Twitter Card tags
    setNameMeta("twitter:title", title);
    setNameMeta("twitter:description", description);
    setNameMeta("twitter:image", image);

    // Also update the document title
    const prevTitle = document.title;
    document.title = `${title} | ShareVault`;

    return () => {
      // Restore defaults on unmount
      setMeta("og:title", defaults.title);
      setMeta("og:description", defaults.description);
      setMeta("og:image", defaults.image);
      setMeta("og:url", defaults.url);
      setMeta("og:type", defaults.type);
      setNameMeta("twitter:title", defaults.title);
      setNameMeta("twitter:description", defaults.description);
      setNameMeta("twitter:image", defaults.image);
      document.title = prevTitle;
    };
  }, [options.title, options.description, options.image, options.url, options.type]);
}