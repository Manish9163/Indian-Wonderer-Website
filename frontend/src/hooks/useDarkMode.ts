import { useState , useEffect } from "react";

export default function useDarkMode(){
    const [darkMode , setDarkMode] = useState(()=>{
        const theme = localStorage.getItem('theme')
        return theme === 'dark' || (!theme && window.matchMedia('(prefer-color-scheme : dark)').matches)
    })

    useEffect(()=>{
        const root = window.document.documentElement
        if(darkMode){
            root.classList.add('dark')
            localStorage.setItem('theme','dark')

        }else{
            root.classList.remove('dark')
            localStorage.setItem('theme','light')

        }
    }, [darkMode])

    return {darkMode , toggleDarkMode : ()=> setDarkMode((prev)=>!prev)}
}
