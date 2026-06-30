export declare const translations: Record<string, Record<string, string>>;
export declare let currentLocale: string;
export declare function switchLocale(locale: string): void;
export declare function getLocaleCallbacks(): ((locale: string) => void)[];
declare const app: {
    $on?(type: string, callback: (e: any) => void): () => void;
    $set?(props: Partial<Record<string, any>>): void;
} & Record<string, any>;
export default app;
//# sourceMappingURL=main.d.ts.map