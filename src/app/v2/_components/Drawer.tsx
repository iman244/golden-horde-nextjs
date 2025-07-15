import clsx from "clsx";
import React, { FC, ReactNode, useCallback, useState } from "react";

const Drawer: FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const onOpen = useCallback(() => setIsOpen(true), []);
  const onClose = useCallback(() => setIsOpen(false), []);
  return (
    <>
      <div
        className="fixed bottom-0 bg-black w-full p-2 block sm:hidden text-white"
        onClick={onOpen}
      >
        open drawer
      </div>
      <div
        className={clsx(
          isOpen ? "top-0" : "top-[100vh]",
          "bg-black fixed w-full h-full right-0 z-10 sm:block transition-all"
        )}
      >
        <div className="text-white bg-gray-700 h-[40px]" onClick={onClose}>
          close drawer
        </div>
        <div className="h-[calc(100vh-40px)]">{children}</div>
      </div>
    </>
  );
};

export default Drawer;
