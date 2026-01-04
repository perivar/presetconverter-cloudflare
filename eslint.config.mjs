import eslintJs from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
// disable eslint-plugin-tailwindcss since it is not compatible with the latest version of Tailwind CSS v4
// import pluginTailwind from "eslint-plugin-tailwindcss";
// use eslintPluginBetterTailwindcss instead
import eslintPluginBetterTailwindcss from "eslint-plugin-better-tailwindcss";
import pluginImport from "eslint-plugin-import";
import pluginJsxA11y from "eslint-plugin-jsx-a11y";
import pluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";
import pluginReactJSXRuntime from "eslint-plugin-react/configs/jsx-runtime.js";
import pluginReactRecommended from "eslint-plugin-react/configs/recommended.js";
import pluginUnusedImports from "eslint-plugin-unused-imports";
import globals from "globals";
import eslintTs from "typescript-eslint";

export default eslintTs.config(
  {
    ignores: [
      "node_modules",
      ".cache",
      ".env",
      "build",
      "build-tmp",
      "public",
      "*.config.ts",
      ".react-router",
      "worker-configuration.d.ts",
      "dist",
    ],
  },
  {
    // Base ESLint configuration for all files
    ...eslintJs.configs.recommended,
    ...pluginPrettierRecommended,
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.commonjs,
        ...globals.es6,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
  },
  {
    // React-specific settings for .js, .jsx, .ts, .tsx files
    files: ["**/*.{js,jsx,ts,tsx}"],
    ...pluginReactRecommended,
    ...pluginReactJSXRuntime,
    // disabled since it is not compatible with the latest version of Tailwind CSS
    // extends: [...pluginTailwind.configs["flat/recommended"]],
    rules: {
      // React-specific rules
      ...pluginReactRecommended.rules,
      ...pluginReactJSXRuntime.rules,
      ...pluginReact.configs.recommended.rules,
      ...pluginReactHooks.configs.recommended.rules,
      ...pluginJsxA11y.configs.recommended.rules,
      ...eslintPluginBetterTailwindcss.configs["recommended-warn"].rules,
      ...eslintPluginBetterTailwindcss.configs["recommended-error"].rules,

      // configure some better-tailwindcss rules individually
      "better-tailwindcss/enforce-consistent-line-wrapping": [
        "warn",
        { group: "newLine", preferSingleLine: true, printWidth: 120 },
      ],
      // fix a shadcn false positive for the navigation-menu component
      "better-tailwindcss/no-unregistered-classes": [
        "error",
        {
          ignore: [
            "origin-top-center",
            "text-destructive-foreground",
            "destructive",
          ],
        },
      ],

      "react/jsx-uses-react": "off",
      "react/react-in-jsx-scope": "off",
      "react/self-closing-comp": "off",
      "react/no-unstable-nested-components": ["warn", { allowAsProps: true }],
      "react/prop-types": "off",
      "jsx-a11y/html-has-lang": "off",
      "jsx-a11y/heading-has-content": "off",
    },
    languageOptions: {
      ...pluginReactRecommended.languageOptions,
      ...pluginReactJSXRuntime.languageOptions,
    },
    plugins: {
      react: pluginReact,
      "react-hooks": pluginReactHooks,
      ["jsx-a11y"]: pluginJsxA11y,
      "better-tailwindcss": eslintPluginBetterTailwindcss,
    },
    settings: {
      react: {
        version: "detect",
      },
      formComponents: ["Form"],
      linkComponents: [
        { name: "Link", linkAttribute: "to" },
        { name: "NavLink", linkAttribute: "to" },
      ],
      "import/resolver": {
        typescript: {},
      },
      "better-tailwindcss": {
        // tailwindcss 4: the path to the entry file of the css based tailwind config (eg: `src/global.css`)
        entryPoint: "app/tailwind.css",
      },
    },
  },
  {
    // TypeScript-specific settings for .ts, .tsx files
    files: ["**/*.{ts,tsx}"],
    extends: [...eslintTs.configs.recommended],
    plugins: {
      import: pluginImport,
      "unused-imports": pluginUnusedImports,
    },
    settings: {
      "import/internal-regex": "^~/",
      "import/resolver": {
        node: {
          extensions: [".ts", ".tsx"],
        },
        typescript: {
          alwaysTryTypes: true,
        },
      },
    },
    rules: {
      // Import and TypeScript-specific rules
      "unused-imports/no-unused-imports": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
        },
      ],
      // Note: you must disable the base rule as it can report incorrect errors
      "no-shadow": "off",
      "@typescript-eslint/no-shadow": [
        "warn",
        {
          ignoreTypeValueShadow: true,
          ignoreFunctionTypeParameterNameValueShadow: true,
        },
      ],
      "@typescript-eslint/no-non-null-asserted-optional-chain": "warn",
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-explicit-any": ["off", { ignoreRestArgs: true }],
      "@typescript-eslint/no-namespace": "warn",
    },
  },
  {
    // ESLint configuration for the config file itself (eslint.config.mjs)
    files: ["eslint.config.mjs"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },

  // Disable rules that would conflict with prettier
  eslintConfigPrettier
);
