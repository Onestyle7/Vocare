import {
    Card,
    CardContent,
  } from "@/components/ui/card"
import { Switch } from "./ui/switch"
import { Separator } from "./ui/separator"

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select"

export function SelectFeature() {
    return (
        <Select>
            <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Theme" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
            </SelectContent>
        </Select>
    )}


const FeatureCard = () => {
  return (
    <Card className="w-full h-full border-gray-100 shadow-sm">
        <CardContent className="flex flex-col w-full h-full px-6 items-center justify-center space-y-3">
            <div className="flex w-full flex-row items-center justify-between">
                Is Repeating?
                <Switch />
            </div>
            <Separator />
            <div className="flex w-full flex-row items-center justify-between">
                Repeat
                <SelectFeature />
            </div>
            <div className="flex w-full flex-row items-center justify-center h-full bg-gray-100 rounded-lg">
                <div className="p-1"></div>
            </div>
        </CardContent>
    </Card>
  )
}

export default FeatureCard