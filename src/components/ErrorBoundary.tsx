import { Component, type ReactNode } from 'react';

/** Route-level safety net: a localized fallback instead of a blank crash. */
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { failed: false };
  }
  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }
  render(): ReactNode {
    if (this.state.failed) {
      const ar = document.documentElement.lang === 'ar';
      return (
        <main className="max-w-xl mx-auto px-4 py-20 text-center">
          <h1 className="font-heading text-2xl">{ar ? 'حدث خطأ غير متوقع' : 'Something went wrong'}</h1>
          <p className="text-stone-soft text-sm mt-2">{ar ? 'حاولي تحديث الصفحة.' : 'Please refresh the page.'}</p>
          <button onClick={() => window.location.reload()} className="mt-4 bg-cocoa text-ivory rounded-full px-6 py-2.5 text-sm">
            {ar ? 'تحديث' : 'Refresh'}
          </button>
        </main>
      );
    }
    return this.props.children;
  }
}
