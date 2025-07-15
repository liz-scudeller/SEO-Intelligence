import { Disclosure } from '@headlessui/react';

export default function AccordionSection({ title, children }) {
  return (
    <Disclosure>
      {({ open }) => (
        <div className="border rounded mb-4">
          <Disclosure.Button className="w-full text-left px-4 py-2 bg-gray-100 font-medium">
            {open ? '▼ ' : '▶︎ '} {title}
          </Disclosure.Button>
          <Disclosure.Panel className="px-4 py-2">
            {children}
          </Disclosure.Panel>
        </div>
      )}
    </Disclosure>
  );
}
