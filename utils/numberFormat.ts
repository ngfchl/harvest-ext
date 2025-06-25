const formatSize = (value: number): string => {
    const sizes = ['', 'W', 'E']
    let i = 0
    while (value >= 10000 && i < sizes.length - 1) {
        value /= 10000
        i++
    }
    return `${value.toFixed(2)}${sizes[i]}`
}

export default (value: number | 'infinity' | 'Infinity'): string => {
    if (!isFinite(<number>value))
        return '∞'
    const numValue = parseFloat(`${value}`)
    return formatSize(numValue)
}