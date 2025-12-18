# OmniMap

OmniMap is an interactive mind-mapping and note-taking web application built with Angular 20. Create nodes, connect them with edges, add rich text content with math formulas ($\frac{a}{b}$), images, and more.

Node-based mapping - Drag, connect, and organize ideas visually

Rich text editing - Tiptap editor with headings, lists, images, tasks

Math support - Type $\frac{a}{b}$ or $\int_0^1 x^2 dx$ → instantly renders fractions, integrals, symbols (KaTeX-powered)

Image embedding - Paste `` → converts to images

Node locking - Protect content from editing while allowing copy/paste

Bezier edge animations - Smooth connections between nodes

Fully static - No backend required, runs anywhere

$\frac{a}{b}$          → a/b fraction
$x^2 + y^2 = r^2$      → circle equation
$\int_0^\infty e^{-x} dx$ → integral
$\sum_{n=1}^\infty \frac{1}{n^2}$ → sum

This project was generated using Angular CLI version 20.3.3.



## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
