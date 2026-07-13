export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/client/", "/driver/dashboard/"],
    },
    sitemap: "https://fasttransfers.net/sitemap.xml",
  };
}
