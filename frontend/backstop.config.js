module.exports = {
  id: 'hearing-aid-mall',
  viewports: [
    { label: 'desktop', width: 1365, height: 768 },
    { label: 'tablet', width: 820, height: 1180 },
    { label: 'mobile', width: 390, height: 844 }
  ],
  scenarios: [
    { label: 'Home', url: 'http://127.0.0.1:5173/' },
    { label: 'Home Search', url: 'http://127.0.0.1:5173/?q=%E9%99%8D%E5%99%AA' },
    { label: 'Home Campaign', url: 'http://127.0.0.1:5173/#campaign' },
    { label: 'Home Support', url: 'http://127.0.0.1:5173/#support' },
    { label: 'Recommendations Empty', url: 'http://127.0.0.1:5173/recommendations' },
    { label: 'Recommendations Perf', url: 'http://127.0.0.1:5173/recommendations?perf=1' },
    { label: 'Login', url: 'http://127.0.0.1:5173/login' },
    { label: 'Register', url: 'http://127.0.0.1:5173/register' },
    { label: 'Cart', url: 'http://127.0.0.1:5173/cart' },
    { label: 'Checkout', url: 'http://127.0.0.1:5173/checkout' },
    { label: 'Profile', url: 'http://127.0.0.1:5173/profile' },
    { label: 'Product Detail 1', url: 'http://127.0.0.1:5173/product/1' },
    { label: 'Admin Login', url: 'http://127.0.0.1:5173/admin/login' },
    { label: 'Admin Forbidden', url: 'http://127.0.0.1:5173/admin/forbidden' },
    { label: 'Admin Dashboard', url: 'http://127.0.0.1:5173/admin' },
    { label: 'Admin Users', url: 'http://127.0.0.1:5173/admin/users' },
    { label: 'Admin Products', url: 'http://127.0.0.1:5173/admin/products' },
    { label: 'Admin Orders', url: 'http://127.0.0.1:5173/admin/orders' },
    { label: 'Admin Sales', url: 'http://127.0.0.1:5173/admin/sales' },
    { label: 'Admin Audit', url: 'http://127.0.0.1:5173/admin/audit' }
  ],
  paths: {
    bitmaps_reference: 'backstop_data/bitmaps_reference',
    bitmaps_test: 'backstop_data/bitmaps_test',
    engine_scripts: 'backstop_data/engine_scripts',
    html_report: 'backstop_data/html_report',
    ci_report: 'backstop_data/ci_report'
  },
  engine: 'playwright',
  engineOptions: {
    args: ['--no-sandbox']
  },
  report: ['browser'],
  debug: false,
  asyncCaptureLimit: 3,
  asyncCompareLimit: 10,
  mismatchThreshold: 0.3
}
