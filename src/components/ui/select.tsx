import * as React from "react"
import { cn } from "@/lib/utils"

const Select = ({ value, onValueChange, children }: any) => {
  return (
    <div className="relative w-full">
      <select 
        value={value} 
        onChange={(e) => onValueChange?.(e.target.value)}
        className="flex h-10 w-full items-center justify-between rounded-md border border-zinc-800 bg-zinc-900 text-white px-3 py-2 text-sm ring-offset-background"
      >
        <option value="" disabled>Select an option...</option>
        {React.Children.map(children, (child: any) => {
          if (child && child.type && child.type.displayName === 'SelectContent') {
             return child.props.children;
          }
          return null;
        })}
      </select>
    </div>
  )
}

const SelectTrigger = (props: any) => null;
const SelectValue = (props: any) => null;
const SelectContent = ({ children }: any) => <>{children}</>;
SelectContent.displayName = 'SelectContent';

const SelectItem = ({ value, children }: any) => {
  return <option value={value} className="bg-zinc-900 text-white">{children}</option>;
}

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem }
