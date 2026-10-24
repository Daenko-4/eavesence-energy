import { Children, type ReactNode } from "react";

/** Keep the committing action last in reading order and at the right edge. */
export default function FormActions({children, className = ""}:{children:ReactNode; className?:string}) {
  const actions = Children.toArray(children);
  return actions.length ? <div className={`form-actions ${className}`} data-form-actions>{actions}</div> : null;
}
