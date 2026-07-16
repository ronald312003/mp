// Habilita el tipado de Server Actions en `<form action={fn}>` con React 18.3
// estable. La firma de llamada de este marcador experimental sólo está en los
// tipos "canary" de @types/react; sin esta augmentación, `action` se resuelve a
// `string` y `next build` falla en los formularios de /admin y /checkout.
// (Sólo afecta a los tipos; ningún efecto en tiempo de ejecución.)
import "react";

declare module "react" {
  interface DO_NOT_USE_OR_YOU_WILL_BE_FIRED_EXPERIMENTAL_FORM_ACTIONS {
    functions: (formData: FormData) => void | Promise<void>;
  }
}
