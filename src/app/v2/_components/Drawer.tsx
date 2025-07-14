import React, { FC, ReactNode } from 'react'

const Drawer: FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <div className='hidden sm:block'>{children}</div>
  )
}

export default Drawer