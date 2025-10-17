import { useState, useEffect, useRef } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import {
  Bot,
  AlertTriangle,
  Radio,
  CloudRain,
  X,
  Mic,
  MicOff,
  Flame,
  Wind,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  HelpCircle,
  ArrowLeft,
  Home,
  MapPin,
  Users,
  FileText,
  Bell,
  Activity,
  Waves,
  Shield,
  Sparkles,
  Zap,
  Phone,
  Map,
  FileQuestionMark
} from "lucide-react"

export default function Rakshak() {
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [response, setResponse] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isRecognizing, setIsRecognizing] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [conversationHistory, setConversationHistory] = useState([])
  const [tooltipVisible, setTooltipVisible] = useState("")
  const [mode, setMode] = useState(null) // null, "doubt", or "beginner"
  const [subMode, setSubMode] = useState(null)
  const [targetRoute, setTargetRoute] = useState(null)
  const [currentToolIndex, setCurrentToolIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState(null)
  const [selectedTool, setSelectedTool] = useState(null)
  const [completedSteps, setCompletedSteps] = useState(
    JSON.parse(localStorage.getItem("disasterManagementProgress") || "[]"),
  )
  const [isWakeWordActive, setIsWakeWordActive] = useState(false)
  const recognitionRef = useRef(null)
  const wakeWordRecognitionRef = useRef(null)
  const isCleaningUp = useRef(false)
  const recognitionState = useRef("idle")
  const conversationRef = useRef(null)
  const lastProcessedRoute = useRef(null)
  const recognitionLock = useRef(false)
  const navigate = useNavigate()
  const location = useLocation()
  const [isMinimized, setIsMinimized] = useState(false)

  // Updated dashboard routes for disaster management
const dashboardRoutes = [
    {
      path: "/dashboard/predict-disaster",
      name: "Future Disaster Prediction",
      icon: "FileText",
      description: "Future Disaster will be predicted and then ",
      details: "Get Future Prediction of the Disaster based on the previous data and current data using advanced Retirval Augment Generation and AI models Also get the Evacautions Steps.",
    },
    {
      path: "/dashboard/gis",
      name: "GIS Mapping",
      icon: "Map",
      description: "Visualize disaster data on interactive maps in real time",
      details: "Get real time GIS mapping of disaster data including flood zones, earthquake epicenters, wildfire spread, and storm paths using interactive maps with layers and geospatial analysis tools.",
    },
    {
      path: "/dashboard/whatif",
      name: "Safety Guidelines",
      icon: "FileQuestionMark",
      description: "This tab contain the information regarding the safety guidelines and Evacuation Steps",
      details:
        "Access comprehensive safety protocols, emergency preparedness checklists, evacuation procedures, and disaster-specific response guidelines to stay safe during emergencies.",
    },

  ]

  const suggestedQuestions = {
  "/dashboard/predict-disaster": [
    "How does disaster prediction work?",
    "What data is used for predictions?",
    "How accurate are the predictions?",
  ],
  "/dashboard/gis": [
    "How do I use the GIS mapping tool?",
    "What layers are available?",
    "Can I see real-time disaster data?",
  ],
  "/dashboard/whatif": [
    "What should I do during an earthquake?",
    "How do I prepare an emergency kit?",
    "What are evacuation procedures?",
  ],
}

  const disasterManagementSteps = [
    {
      path: "/dashboard/predict-disaster",
      name: "step-1 : Future Disaster Prediction",
      icon: "FileText",
      description: "Future Disaster will be predicted and then ",
      details: "Get Future Prediction of the Disaster based on the previous data and current data using advanced Retirval Augment Generation and AI models Also get the Evacautions Steps.",
    },
    {
      path: "/dashboard/gis",
      name: "step-2 : GIS Mapping",
      icon: "Map",
      description: "Visualize disaster data on interactive maps in real time",
      details: "Get real time GIS mapping of disaster data including flood zones, earthquake epicenters, wildfire spread, and storm paths using interactive maps with layers and geospatial analysis tools.",
    },
    {
      path: "/dashboard/whatif",
      name: "step-3 : Safety Guidelines",
      icon: "QuestionMarkCircle",
      description: "This tab contain the information regarding the safety guidelines and Evacuation Steps",
      details:
        "Access comprehensive safety protocols, emergency preparedness checklists, evacuation procedures, and disaster-specific response guidelines to stay safe during emergencies.",
    },
  ]

  // Map icon names to components
  const iconMap = {
    Home: <Home className="h-4 w-4" />,
    Bell: <Bell className="h-4 w-4" />,
    Phone: <Phone className="h-4 w-4" />,
    Shield: <Shield className="h-4 w-4" />,
    Map: <Map className="h-4 w-4" />,
    CloudRain: <CloudRain className="h-4 w-4" />,
    FileText: <FileText className="h-4 w-4" />,
    Users: <Users className="h-4 w-4" />,
    Activity: <Activity className="h-4 w-4" />,
    Radio: <Radio className="h-4 w-4" />,
    AlertTriangle: <AlertTriangle className="h-4 w-4" />,
    Mic: <Mic className="h-4 w-4" />,
    Bot: <Bot className="h-4 w-4" />,
    Flame: <Flame className="h-4 w-4" />,
    Wind: <Wind className="h-4 w-4" />,
    Waves: <Waves className="h-4 w-4" />,
    MapPin: <MapPin className="h-4 w-4" />,
  }

  // Normalize path for route comparison
  const normalizePath = (path) => {
    if (!path || typeof path !== "string") {
      console.warn(`Invalid path: ${path}, returning default '/dashboard'`)
      return "/dashboard"
    }
    return path.replace(/\/+$/, "").toLowerCase()
  }

  // Initialize Web Speech API
  const createRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      console.error("SpeechRecognition API not supported.")
      return null
    }
    const recognition = new SpeechRecognition()
    recognition.lang = "en-US"
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    recognition.continuous = true
    return recognition
  }

  // Initialize wake word recognition
  const initializeWakeWordRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      console.error("SpeechRecognition API not supported.")
      return null
    }
    
    const recognition = new SpeechRecognition()
    recognition.lang = "en-US"
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    recognition.continuous = true
    
    recognition.onresult = (event) => {
      const speechResult = event.results[event.results.length - 1][0].transcript.trim().toLowerCase()
      console.log(`Wake word recognition result: "${speechResult}"`)
      
      if (speechResult.includes("rakshak")) {
        console.log("Wake word detected!")
        setIsPanelOpen(true)
        recognition.stop()
        
        // Start the conversation in doubt mode
        setTimeout(() => {
          startConversation("doubt")
        }, 500)
      }
    }
    
    recognition.onerror = (event) => {
      console.error(`Wake word recognition error: ${event.error}`)
      if (event.error === "no-speech") {
        // Restart recognition after a short delay
        setTimeout(() => {
          if (!isPanelOpen && isWakeWordActive) {
            try {
              recognition.start()
            } catch (e) {
              console.error("Error restarting wake word recognition:", e)
            }
          }
        }, 1000)
      }
    }
    
    recognition.onend = () => {
      // Restart recognition if panel is still closed and wake word is active
      if (!isPanelOpen && isWakeWordActive) {
        setTimeout(() => {
          try {
            recognition.start()
          } catch (e) {
            console.error("Error restarting wake word recognition:", e)
          }
        }, 1000)
      }
    }
    
    return recognition
  }

  // Configure recognition handlers
  const setupRecognition = (recognition) => {
    recognition.onstart = () => {
      console.log("Recognition started")
      setIsRecognizing(true)
      recognitionState.current = "active"
    }

    recognition.onresult = async (event) => {
      const speechResult = event.results[event.results.length - 1][0].transcript.trim()
      console.log(`Captured transcript: "${speechResult}"`)
      setTranscript(speechResult)
      setConversationHistory((prev) => [...prev, { type: "user", text: speechResult }])

      if (speechResult.toLowerCase().includes("stop") || speechResult.toLowerCase().includes("thank you")) {
        console.log("Stop command detected, stopping conversation")
        await stopConversation()
        return
      }

      await fetchResponse(speechResult)
    }

    recognition.onend = async () => {
      console.log(`Recognition ended - isListening: ${isListening}, isSpeaking: ${isSpeaking}`)
      setIsRecognizing(false)
      recognitionState.current = "idle"
      if (!isCleaningUp.current && !isSpeaking && isListening && mode === "doubt") {
        console.log("Restarting recognition")
        await startRecognition()
      }
    }

    recognition.onerror = async (event) => {
      console.error(`Speech recognition error: ${event.error}`)
      setIsRecognizing(false)
      recognitionState.current = "idle"
      if (event.error === "no-speech" && !isCleaningUp.current && isListening && mode === "doubt") {
        const message = "I didn't hear anything. Please try again."
        setConversationHistory((prev) => [...prev, { type: "rakshak", text: message }])
        await speakResponse(message)
        await startRecognition()
      } else {
        recognitionRef.current = null
        if (!isCleaningUp.current && isListening && mode === "doubt") {
          await startRecognition()
        }
      }
    }
  }

  // Start speech recognition
  const startRecognition = async (retryCount = 0) => {
    if (recognitionLock.current || isCleaningUp.current || isSpeaking) {
      console.log("Recognition blocked")
      if (isSpeaking && retryCount < 3) {
        await new Promise((resolve) => setTimeout(resolve, 500))
        await startRecognition(retryCount + 1)
      }
      return
    }

    recognitionLock.current = true

    try {
      if (recognitionRef.current && (isRecognizing || recognitionState.current === "active")) {
        recognitionRef.current.stop()
        await new Promise((resolve) => setTimeout(resolve, 200))
      }

      if (!recognitionRef.current) {
        recognitionRef.current = createRecognition()
        if (!recognitionRef.current) {
          recognitionLock.current = false
          const errorMessage = "Speech recognition is not supported on this device."
          setConversationHistory((prev) => [...prev, { type: "rakshak", text: errorMessage }])
          await speakResponse(errorMessage)
          setIsListening(false)
          return
        }
        setupRecognition(recognitionRef.current)
      }

      recognitionRef.current.start()
      setIsListening(true)
      setIsRecognizing(true)
    } catch (error) {
      console.error(`Error starting recognition: ${error}`)
      setIsRecognizing(false)
      recognitionState.current = "idle"

      if (retryCount < 2) {
        recognitionRef.current = null
        await new Promise((resolve) => setTimeout(resolve, 200))
        await startRecognition(retryCount + 1)
      } else {
        const message = "Sorry, I couldn't start speech recognition. Please try again."
        setConversationHistory((prev) => [...prev, { type: "rakshak", text: message }])
        await speakResponse(message)
        setIsListening(false)
      }
    } finally {
      recognitionLock.current = false
    }
  }

  // Speak response using Web Speech API
  const speakResponse = async (text) => {
    return new Promise((resolve) => {
      if (!text || typeof text !== "string") {
        console.error("Invalid text for speech synthesis:", text)
        setIsSpeaking(false)
        resolve()
        return
      }

      if (recognitionRef.current && isRecognizing) {
        try {
          recognitionRef.current.stop()
          setIsRecognizing(false)
          recognitionState.current = "idle"
        } catch (error) {
          console.error(`Error stopping recognition: ${error}`)
        }
      }

      window.speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = "en-US"
      utterance.rate = 0.9
      utterance.onstart = () => {
        setIsSpeaking(true)
      }
      utterance.onend = async () => {
        setIsSpeaking(false)
        if (mode === "doubt" && isListening && !isCleaningUp.current) {
          await startRecognition()
        }
        resolve()
      }
      utterance.onerror = (event) => {
        console.error(`Speech synthesis error: ${event.error}`)
        setIsSpeaking(false)
        resolve()
      }
      window.speechSynthesis.speak(utterance)
    })
  }

  // Start conversation
  const startConversation = async (selectedMode) => {
    isCleaningUp.current = false
    setIsPanelOpen(true)
    setIsListening(false)
    setIsRecognizing(false)
    setTranscript("")
    setResponse("")
    setConversationHistory([])
    setMode(selectedMode)
    setSubMode(null)
    setTargetRoute(null)
    setCurrentToolIndex(0)
    setSelectedTool(null)
    setSelectedOption(null)
    setCompletedSteps(JSON.parse(localStorage.getItem("disasterManagementProgress") || "[]"))

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch (error) {
        console.error(`Error stopping recognition: ${error}`)
      }
      recognitionRef.current = null
    }

    let welcomeMessage = ""
    if (selectedMode === "doubt") {
      welcomeMessage =
        "I am Rakshak, your disaster management and awareness assistant. I'm here to help you stay safe and prepared. Please speak your question."
      setConversationHistory([{ type: "rakshak", text: welcomeMessage }])
      await speakResponse(welcomeMessage)
      setIsListening(true)
      await startRecognition()
    } else if (selectedMode === "beginner") {
      welcomeMessage =
        "Welcome to Disaster Management System! I'm Rakshak, and I'll guide you through emergency preparedness and disaster response. Please select an option."
      setConversationHistory([{ type: "rakshak", text: welcomeMessage }])
      await speakResponse(welcomeMessage)
      setSubMode("waiting_for_selection")
    }
  }

  // Stop conversation
  const stopConversation = async () => {
    setIsListening(false)
    setIsRecognizing(false)

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch (error) {
        console.error(`Error stopping recognition: ${error}`)
      }
      recognitionRef.current = null
    }

    const goodbyeMessage =
      "Thank you for using  Rakshak! Stay safe and prepared. Remember to check alerts regularly. Have a safe day!"
    setConversationHistory((prev) => [...prev, { type: "rakshak", text: goodbyeMessage }])

    try {
      await speakResponse(goodbyeMessage)
    } catch (error) {
      console.error("Error speaking goodbye message:", error)
    }

    isCleaningUp.current = true
    window.speechSynthesis.cancel()

    setMode(null)
    setSubMode(null)
    setTargetRoute(null)
    setCurrentToolIndex(0)
    setSelectedTool(null)
    setSelectedOption(null)
    setCompletedSteps([])
    localStorage.setItem("disasterManagementProgress", JSON.stringify([]))

    setIsPanelOpen(false)
    isCleaningUp.current = false
    
    // Restart wake word recognition
    if (isWakeWordActive) {
      setTimeout(() => {
        try {
          wakeWordRecognitionRef.current = initializeWakeWordRecognition()
          if (wakeWordRecognitionRef.current) {
            wakeWordRecognitionRef.current.start()
          }
        } catch (e) {
          console.error("Error restarting wake word recognition:", e)
        }
      }, 1000)
    }
  }

  // Generate fallback response based on keywords
  const generateFallbackResponse = (query) => {
    const lowerQuery = query.toLowerCase()
    
    // Earthquake responses
    if (lowerQuery.includes("earthquake")) {
      if (lowerQuery.includes("during")) {
        return "During an earthquake, drop to the ground, take cover under a sturdy desk or table, and hold on until the shaking stops. Stay away from windows, heavy objects, and exterior walls. If you're outdoors, move away from buildings, trees, and power lines. If you're driving, pull over to a clear location and stay inside the vehicle."
      } else if (lowerQuery.includes("prepare")) {
        return "To prepare for an earthquake, secure heavy items like bookshelves and water heaters to wall studs. Store breakable items in low, closed cabinets. Create an emergency kit with water, food, medications, flashlights, and first aid supplies. Make a family communication plan and identify safe spots in each room."
      } else {
        return "Earthquakes are sudden shaking of the ground caused by seismic waves. They can cause buildings to collapse, trigger landslides, and create tsunamis. To stay safe, identify safe spots in your home, secure heavy furniture, and have an emergency kit ready. After an earthquake, check for injuries and damage, and be prepared for aftershocks."
      }
    }
    
    // Flood responses
    else if (lowerQuery.includes("flood")) {
      if (lowerQuery.includes("during")) {
        return "During a flood, move to higher ground immediately. Avoid walking or driving through flood waters, as just 6 inches of moving water can knock you down. If you're in a car and water rises around it, abandon the car and move to higher ground. Listen to emergency broadcasts for updates."
      } else if (lowerQuery.includes("prepare")) {
        return "To prepare for a flood, elevate utilities like water heaters and electrical panels. Install 'check valves' to prevent floodwater from backing up into drains. Create an emergency kit with important documents in waterproof containers. Make a family evacuation plan and know your community's evacuation routes."
      } else {
        return "Floods are the most common natural disaster and can occur anywhere. They develop slowly or quickly, as in the case of flash floods. To stay safe, know your flood risk, have an evacuation plan, and never ignore evacuation orders. After a flood, wait for authorities to declare it safe before returning home."
      }
    }
    
    // Fire responses
    else if (lowerQuery.includes("fire")) {
      if (lowerQuery.includes("wildfire")) {
        return "During a wildfire, be ready to evacuate at a moment's notice. Keep your emergency kit and important documents in your vehicle. Close all windows, doors, and vents to prevent embers from entering your home. Listen to emergency services and follow evacuation orders. After a wildfire, wait for authorities to declare it safe before returning."
      } else if (lowerQuery.includes("home")) {
        return "During a home fire, get out and stay out. If you must escape through smoke, get low and go under the smoke to your exit. Feel doors before opening them - if hot, use another way out. Once outside, go to your meeting place and call for help. Never go back inside a burning building."
      } else {
        return "Fires can spread rapidly and produce toxic smoke that can disorient and overcome you. To prevent fires, keep flammable items away from heat sources, never leave cooking unattended, and maintain smoke alarms. Have fire extinguishers accessible and know how to use them. Practice your escape plan with your family regularly."
      }
    }
    
    // Hurricane responses
    else if (lowerQuery.includes("hurricane") || lowerQuery.includes("cyclone") || lowerQuery.includes("typhoon")) {
      if (lowerQuery.includes("prepare")) {
        return "To prepare for a hurricane, board up windows with plywood, trim or remove damaged trees, and bring loose outdoor objects inside. Create an emergency kit with enough supplies for at least 3 days. Know your evacuation route and have a plan for your pets. Keep important documents in a waterproof container."
      } else {
        return "Hurricanes are powerful storms with high winds and heavy rain that can cause flooding and damage. Monitor weather reports and heed evacuation orders. During a hurricane, stay indoors away from windows, in a small interior room on the lowest level. After the storm, be aware of downed power lines, gas leaks, and contaminated water."
      }
    }
    
    // Tornado responses
    else if (lowerQuery.includes("tornado")) {
      if (lowerQuery.includes("during")) {
        return "During a tornado, seek shelter immediately in a basement, storm cellar, or interior room on the lowest floor. Stay away from windows, doors, and outside walls. If you're in a vehicle or mobile home, get out immediately and go to the lowest floor of a sturdy building. If you're outside with no shelter, lie flat in a ditch and cover your head."
      } else {
        return "Tornadoes are violently rotating columns of air that extend from a thunderstorm to the ground. They can destroy buildings, flip cars, and create deadly flying debris. Know the difference between a tornado watch (conditions are favorable) and warning (a tornado has been sighted). Have a family emergency plan and practice where to take shelter."
      }
    }
    
    // Emergency kit responses
    else if (lowerQuery.includes("emergency kit") || lowerQuery.includes("disaster kit")) {
      return "An emergency kit should include: water (1 gallon per person per day for at least 3 days), non-perishable food (3-day supply), battery-powered radio, flashlight, extra batteries, first aid kit, medications, whistle to signal for help, dust masks, plastic sheeting and duct tape, manual can opener, local maps, and important family documents in a waterproof container. Customize your kit based on your family's needs."
    }
    
    // Evacuation responses
    else if (lowerQuery.includes("evacuat")) {
      return "When evacuating, follow recommended evacuation routes and don't take shortcuts. Bring your emergency kit, important documents, and medications. Wear protective clothing and sturdy shoes. Lock your home and unplug appliances. Let others know where you're going. If you have pets, make arrangements for them as most emergency shelters don't accept animals."
    }
    
    // General disaster response
    else {
      return "Disaster preparedness is crucial for everyone. Create an emergency plan with your family, including communication methods and meeting places. Assemble an emergency kit with essential supplies. Stay informed about potential hazards in your area. Learn basic first aid and CPR. During any disaster, follow instructions from emergency services and prioritize your safety above all else."
    }
  }

  // Fetch response from Gemini API
  const fetchResponse = async (query) => {
    setIsLoading(true)
    const contextInfo = selectedTool ? `Current tool context: ${selectedTool.name}. ` : ""
    const problemStatement = `You are Rakshak, an AI assistant specialized in disaster management, emergency response, and safety awareness. Your primary mission is to spread awareness about disaster preparedness and provide life-saving information during emergencies. ${contextInfo}Answer the user's query comprehensively and accurately with a focus on safety, preparedness, and disaster awareness. Provide practical, actionable advice that can help save lives. Include specific steps for different types of disasters (earthquakes, floods, wildfires, hurricanes, etc.) when relevant. Keep your response concise but informative. Query: ${query}`

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=AIzaSyBUB_JYncrqpo-BZF_PcqqkA4EE1t0Yj9E`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: problemStatement }] }],
          }),
        },
      )

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
      }

      const data = await response.json()
      
      // Check if the response has the expected structure
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0]) {
        throw new Error("Invalid response structure from API")
      }
      
      const text = data.candidates[0].content.parts[0].text
      setResponse(text)
      setConversationHistory((prev) => [...prev, { type: "rakshak", text }])
      await speakResponse(text)

      const rakshakEntry = {
        title: `Query: ${query.slice(0, 50)}`,
        questions: query,
        answers: text,
        toolContext: selectedTool?.name || "General",
        userId: "disaster-user",
        createdAt: new Date().toISOString(),
      }
      const storedEntries = JSON.parse(localStorage.getItem("rakshakEntries") || "[]")
      storedEntries.push(rakshakEntry)
      localStorage.setItem("rakshakEntries", JSON.stringify(storedEntries))

      if (mode === "beginner" && (subMode === "resolving_doubt" || subMode === "waiting_for_question")) {
        setSubMode("waiting_for_question")
        const followUpPrompt = "Would you like to ask another question or select a different tool/step?"
        setConversationHistory((prev) => [...prev, { type: "rakshak", text: followUpPrompt }])
        await speakResponse(followUpPrompt)
      }
    } catch (error) {
      console.error(`Error fetching Gemini API: ${error}`)
      
      // Generate a fallback response based on the query
      const fallbackResponse = generateFallbackResponse(query)
      
      setResponse(fallbackResponse)
      setConversationHistory((prev) => [...prev, { type: "rakshak", text: fallbackResponse }])
      await speakResponse(fallbackResponse)

      if (mode === "beginner") {
        setSubMode("waiting_for_question")
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Handle dashboard tools selection
  const handleDashboardSelection = async () => {
    setSelectedOption("dashboard")
    setSubMode("waiting_for_tool_selection")
    const prompt = "You chose to explore disaster management tools. Please select a tool to learn about."
    setConversationHistory((prev) => [...prev, { type: "rakshak", text: prompt }])
    await speakResponse(prompt)
  }

  // Handle disaster management selection
  const handleDisasterManagementSelection = async () => {
    setSelectedOption("disasterManagement")
    setSubMode("waiting_for_step_selection")
    const prompt = "You chose the disaster preparedness process. Please select the current step to begin."
    setConversationHistory((prev) => [...prev, { type: "rakshak", text: prompt }])
    await speakResponse(prompt)
  }

  // Handle manual tool selection
  const handleToolSelection = async (tool) => {
    setSelectedTool({ ...tool, icon: tool.icon })
    const prompt = `You selected ${tool.name}. Now navigating to that page for more information.`
    setConversationHistory((prev) => [...prev, { type: "rakshak", text: prompt }])
    await speakResponse(prompt)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    navigate(tool.path, { replace: true, state: { fromRakshak: true } })
    setTargetRoute(tool.path)
    setSubMode("explaining_tab")
    setCurrentToolIndex(dashboardRoutes.findIndex((t) => t.path === tool.path))
    lastProcessedRoute.current = tool.path
    await speakFieldsForRoute(tool.path)
  }

  // Handle manual step selection
  const handleStepSelection = async (step) => {
    setSelectedTool({ ...step, icon: step.icon })
    const prompt = `You selected ${step.name}. Now navigating to that page for more information.`
    setConversationHistory((prev) => [...prev, { type: "rakshak", text: prompt }])
    await speakResponse(prompt)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    navigate(step.path, { replace: true, state: { fromRakshak: true } })
    setTargetRoute(step.path)
    setSubMode("explaining_tab")
    setCurrentToolIndex(disasterManagementSteps.findIndex((s) => s.path === step.path))
    setCompletedSteps((prev) => {
      const newSteps = [...prev, step.path]
      localStorage.setItem("disasterManagementProgress", JSON.stringify(newSteps))
      return newSteps
    })
    await speakFieldsForRoute(step.path)
  }

  // Proceed to next step
  const proceedToNextStep = async () => {
    setCompletedSteps((prev) => {
      const newSteps = [...prev, disasterManagementSteps[currentToolIndex].path]
      localStorage.setItem("disasterManagementProgress", JSON.stringify(newSteps))
      return newSteps
    })
    const completionPrompt = `Step ${currentToolIndex + 1} completed!`
    setConversationHistory((prev) => [...prev, { type: "rakshak", text: completionPrompt }])
    await speakResponse(completionPrompt)

    if (currentToolIndex < disasterManagementSteps.length - 1) {
      const nextStep = disasterManagementSteps[currentToolIndex + 1]
      const prompt = `Moving to ${nextStep.name}.`
      setConversationHistory((prev) => [...prev, { type: "rakshak", text: prompt }])
      await speakResponse(prompt)
      await new Promise((resolve) => setTimeout(resolve, 1000))
      navigate(nextStep.path, { replace: true, state: { fromRakshak: true } })
      setTargetRoute(nextStep.path)
      setSubMode("explaining_tab")
      setCurrentToolIndex(currentToolIndex + 1)
      lastProcessedRoute.current = nextStep.path
      await speakFieldsForRoute(nextStep.path)
    } else {
      const prompt =
        "You've completed the disaster preparedness process. Click 'End Process' to complete or explore other options."
      setConversationHistory((prev) => [...prev, { type: "rakshak", text: prompt }])
      await speakResponse(prompt)
      setSubMode("tour_complete")
    }
  }

  // End process
  const endProcess = async () => {
    const congratsPrompt =
      "Congratulations! You've successfully completed the disaster preparedness process! Would you like to restart or explore other tools?"
    setConversationHistory((prev) => [...prev, { type: "rakshak", text: congratsPrompt }])
    await speakResponse(congratsPrompt)
    setSubMode("process_ended")
    setCurrentToolIndex(0)
    setCompletedSteps([])
    localStorage.setItem("disasterManagementProgress", JSON.stringify([]))
  }

  // Restart process
  const restartProcess = async () => {
    setCompletedSteps([])
    localStorage.setItem("disasterManagementProgress", JSON.stringify([]))
    const routes = selectedOption === "disasterManagement" ? disasterManagementSteps : dashboardRoutes
    const prompt = `Starting over with ${routes[0].name}.`
    setConversationHistory((prev) => [...prev, { type: "rakshak", text: prompt }])
    await speakResponse(prompt)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    navigate(routes[0].path, { replace: true, state: { fromRakshak: true } })
    setTargetRoute(routes[0].path)
    setSubMode("explaining_tab")
    setCurrentToolIndex(0)
    lastProcessedRoute.current = routes[0].path
    await speakFieldsForRoute(routes[0].path)
  }

  // Speak form fields
  const speakFieldsForRoute = async (route) => {
    const normalizedRoute = normalizePath(route)
    const foundRoute =
      dashboardRoutes.find((r) => normalizePath(r.path) === normalizedRoute) ||
      disasterManagementSteps.find((s) => normalizePath(s.path) === normalizedRoute)

    if (!foundRoute) {
      const message = "It seems you're on an unrecognized page. Let's return to the dashboard home."
      setConversationHistory((prev) => [...prev, { type: "rakshak", text: message }])
      await speakResponse(message)
      navigate("/dashboard", { replace: true, state: { fromRakshak: true } })
      lastProcessedRoute.current = "/dashboard"
      return
    }

    const fullMessage = `Now at ${foundRoute.name}. ${foundRoute.details || foundRoute.description}`
    setConversationHistory((prev) => [...prev, { type: "rakshak", text: fullMessage }])
    await speakResponse(fullMessage)

    if (mode === "beginner") {
      setSubMode("waiting_for_question")
      const questionPrompt =
        "Do you have any questions about this tool? If not, you can select another step or proceed to the next step."
      setConversationHistory((prev) => [...prev, { type: "rakshak", text: questionPrompt }])
      await speakResponse(questionPrompt)
    }
  }

  // Scroll to bottom
  useEffect(() => {
    if (conversationRef.current) {
      conversationRef.current.scrollTop = conversationRef.current.scrollHeight
    }
  }, [conversationHistory])

  // Initialize wake word recognition on component mount
  useEffect(() => {
    // Check if speech recognition is supported
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      setIsWakeWordActive(true)
      wakeWordRecognitionRef.current = initializeWakeWordRecognition()
      if (wakeWordRecognitionRef.current) {
        try {
          wakeWordRecognitionRef.current.start()
        } catch (error) {
          console.error("Error starting wake word recognition:", error)
        }
      }
    } else {
      console.log("Speech recognition not supported")
    }

    return () => {
      // Clean up wake word recognition
      if (wakeWordRecognitionRef.current) {
        try {
          wakeWordRecognitionRef.current.stop()
        } catch (error) {
          console.error("Error stopping wake word recognition:", error)
        }
      }
    }
  }, [])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      isCleaningUp.current = true
      window.speechSynthesis.cancel()
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch (error) {
          console.error(`Error stopping recognition: ${error}`)
        }
      }
      recognitionRef.current = null
    }
  }, [])

  // Save progress
  useEffect(() => {
    localStorage.setItem("disasterManagementProgress", JSON.stringify(completedSteps))
  }, [completedSteps])

  const resetToInitialSelection = async () => {
    const prompt = "Returning to the initial selection screen. How can I help you today?"
    setConversationHistory((prev) => [...prev, { type: "rakshak", text: prompt }])
    await speakResponse(prompt)
    setMode(null)
    setSubMode(null)
    setSelectedOption(null)
    setTargetRoute(null)
    setSelectedTool(null)
    setCurrentToolIndex(0)
    setCompletedSteps([])
    localStorage.setItem("disasterManagementProgress", JSON.stringify([]))
  }

  return (
    <div className="font-body">
      {/* Trigger Button - Yellow & Black Theme */}
      <button
        onClick={() => setIsPanelOpen(true)}
        disabled={isPanelOpen}
        onMouseEnter={() => setTooltipVisible("trigger")}
        onMouseLeave={() => setTooltipVisible("")}
        aria-label={isPanelOpen ? "Close Rakshak Assistant" : "Open Rakshak Assistant"}
        className={`fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-110 flex items-center justify-center z-50 group ${
          isPanelOpen
            ? "bg-yellow-500 hover:shadow-yellow-500/50"
            : "bg-yellow-500 hover:shadow-yellow-500/50 animate-pulse"
        }`}
        style={{ boxShadow: '0 0 30px rgba(234, 179, 8, 0.6)' }}
      >
        <Bot className="h-7 w-7 text-black transition-transform duration-300 group-hover:rotate-12" />
      </button>

      {/* Pointing Message */}
      {!isPanelOpen && (
        <div className="fixed bottom-24 right-6 z-40 animate-bounce">
          <div className="relative bg-black rounded-2xl shadow-2xl p-4 mb-2 border-2 border-yellow-500">
            <div className="absolute right-6 bottom-0 transform translate-y-full w-4 h-4 bg-black border-r-2 border-b-2 border-yellow-500"></div>
            <div className="flex items-center space-x-3">
              <div className="bg-yellow-500 p-2 rounded-full">
                <Bot className="h-6 w-6 text-black" />
              </div>
              <div>
                <div className="text-base font-heading font-semibold text-yellow-500">Disaster Alert System</div>
                <div className="text-sm text-yellow-400 font-body">Say "Rakshak" to activate</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Right Side Panel - Yellow & Black Theme */}
      {isPanelOpen && (
        <div className="fixed top-16 right-4 h-[92vh] w-[32rem] bg-black shadow-2xl z-50 flex flex-col border-2 border-yellow-500 rounded-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b-2 border-yellow-500 bg-gradient-to-r from-yellow-600 to-yellow-500 rounded-t-2xl">
            <div className="flex items-center space-x-3">
              {mode && (
                <button
                  onClick={resetToInitialSelection}
                  aria-label="Back to initial selection"
                  className="rounded-full h-10 w-10 bg-black hover:bg-gray-900 text-yellow-500 flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110 border-2 border-yellow-500"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
              )}
              <div className="bg-black p-2 rounded-full border-2 border-yellow-500">
                <AlertTriangle className="h-7 w-7 text-yellow-500" />
              </div>
              <div>
                <h2 className="text-2xl font-heading font-bold text-black">
                  RAKSHAK
                </h2>
                <div className="text-xs text-black font-code">Disaster Management AI</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  const helpPrompt =
                    "In beginner mode, you can type questions or follow guided steps. In doubt mode, use voice input to ask questions. Use the buttons to navigate or say 'stop' to end the conversation."
                  setConversationHistory((prev) => [...prev, { type: "rakshak", text: helpPrompt }])
                  speakResponse(helpPrompt)
                }}
                aria-label="Help"
                className="rounded-full h-10 w-10 bg-black hover:bg-gray-900 text-yellow-500 flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110 border-2 border-yellow-500"
              >
                <HelpCircle className="h-5 w-5" />
              </button>
              <button
                onClick={stopConversation}
                aria-label="Close panel"
                className="rounded-full h-10 w-10 bg-black hover:bg-gray-900 text-red-500 flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110 border-2 border-red-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <div className="flex flex-col h-full overflow-hidden">
              {/* Welcome Screen */}
              {!mode && (
                <div className="flex-1 p-6 flex flex-col items-center justify-center space-y-6 overflow-y-auto bg-black">
                  <div className="text-center">
                    <div className="bg-yellow-500 p-6 rounded-2xl w-20 h-20 mx-auto mb-6 flex items-center justify-center border-2 border-yellow-600">
                      <AlertTriangle className="h-10 w-10 text-black" />
                    </div>
                    <h3 className="text-2xl font-heading font-bold text-yellow-500 mb-3">Welcome to Disaster Alert</h3>
                    <p className="text-base text-yellow-400 font-body leading-relaxed mb-2">
                      Choose an option to start your emergency preparedness journey.
                    </p>
                    <p className="text-sm text-yellow-300 font-body">
                      Please speak clearly and loud enough in conversation
                    </p>
                  </div>

                  <div className="w-full space-y-4 max-w-sm">
                    <button
                      onClick={() => startConversation("beginner")}
                      className="w-full py-4 px-6 bg-yellow-500 text-black rounded-2xl hover:bg-yellow-400 transition-all duration-300 text-base font-heading font-semibold shadow-2xl transform hover:scale-105 border-2 border-yellow-600"
                      aria-label="Start as a beginner"
                    >
                      <div className="flex items-center justify-center space-x-3">
                        <Shield className="h-6 w-6" />
                        <span>Beginner Guide</span>
                        <Sparkles className="h-5 w-5 animate-pulse" />
                      </div>
                    </button>

                    <button
                      onClick={() => startConversation("doubt")}
                      className="w-full py-4 px-6 bg-yellow-600 text-black rounded-2xl hover:bg-yellow-500 transition-all duration-300 text-base font-heading font-semibold shadow-2xl transform hover:scale-105 border-2 border-yellow-700"
                      aria-label="Ask a question"
                    >
                      <div className="flex items-center justify-center space-x-3">
                        <Mic className="h-6 w-6" />
                        <span>Voice Questions</span>
                        <Zap className="h-5 w-5 animate-pulse" />
                      </div>
                    </button>
                  </div>

                  <div className="w-full pt-6 border-t-2 border-yellow-500 max-w-sm">
                    <h4 className="text-sm font-label font-medium text-yellow-400 mb-4 text-center">Quick Actions</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => {
                          const helpPrompt =
                            "Here are some example questions: 'What should I do during an earthquake?', 'How do I prepare an emergency kit?', 'Where are the nearest shelters?'"
                          setConversationHistory([{ type: "rakshak", text: helpPrompt }])
                          speakResponse(helpPrompt)
                          setMode("doubt")
                        }}
                        className="p-3 bg-yellow-500/20 rounded-xl text-sm text-yellow-400 hover:bg-yellow-500/30 hover:text-yellow-300 transition-all duration-300 font-body border-2 border-yellow-500/30 hover:border-yellow-500"
                      >
                        Examples
                      </button>
                      <button
                        onClick={() => {
                          const tutorialPrompt =
                            "I'll guide you through disaster preparedness step by step. Let's start!"
                          setConversationHistory([{ type: "rakshak", text: tutorialPrompt }])
                          speakResponse(tutorialPrompt)
                          setMode("beginner")
                          setSubMode("waiting_for_selection")
                        }}
                        className="p-3 bg-yellow-500/20 rounded-xl text-sm text-yellow-400 hover:bg-yellow-500/30 hover:text-yellow-300 transition-all duration-300 font-body border-2 border-yellow-500/30 hover:border-yellow-500"
                      >
                        Tutorial
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {mode && (
                <div className="flex flex-col h-full overflow-hidden">
                  {/* Progress Header */}
                  {mode === "beginner" &&
                    selectedOption === "disasterManagement" &&
                    subMode !== "waiting_for_selection" &&
                    subMode !== "waiting_for_step_selection" &&
                    subMode !== "process_ended" && (
                      <div className="p-4 bg-yellow-500/10 border-b-2 border-yellow-500 flex-shrink-0">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-base font-heading font-medium text-yellow-500">Disaster Preparedness</h3>
                          <div className="text-sm text-yellow-400 font-code">
                            Step {currentToolIndex + 1} of {disasterManagementSteps.length}
                          </div>
                        </div>
                        <div className="w-full bg-gray-800 border-2 border-yellow-500 rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-yellow-500 h-3 rounded-full transition-all duration-700"
                            style={{ width: `${((currentToolIndex + 1) / disasterManagementSteps.length) * 100}%` }}
                          ></div>
                        </div>
                        <div className="flex items-center space-x-2 overflow-x-auto pb-2 mt-3">
                          {disasterManagementSteps.map((step, index) => (
                            <div
                              key={index}
                              className={`flex-shrink-0 flex items-center transition-all duration-300 ${
                                completedSteps.includes(step.path)
                                  ? "text-green-500"
                                  : index === currentToolIndex
                                  ? "text-yellow-500"
                                  : "text-gray-500"
                              }`}
                            >
                              <div
                                className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                                  completedSteps.includes(step.path)
                                    ? "bg-green-500/20 border-2 border-green-500"
                                    : index === currentToolIndex
                                    ? "bg-yellow-500/20 border-2 border-yellow-500"
                                    : "bg-gray-800 border-2 border-gray-600"
                                }`}
                              >
                                {completedSteps.includes(step.path) ? (
                                  <CheckCircle className="h-4 w-4" />
                                ) : (
                                  <span className="font-code">{index + 1}</span>
                                )}
                              </div>
                              {index < disasterManagementSteps.length - 1 && (
                                <ChevronRight className="h-4 w-4 mx-2 text-gray-500" />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Current step details */}
                  {mode === "beginner" &&
                    selectedOption === "disasterManagement" &&
                    subMode !== "waiting_for_selection" &&
                    subMode !== "waiting_for_step_selection" &&
                    subMode !== "process_ended" && (
                      <div className="p-4 bg-yellow-500/10 border-b-2 border-yellow-500 flex-shrink-0">
                        <div className="flex items-start space-x-4">
                          <div className="bg-yellow-500 p-3 rounded-xl border-2 border-yellow-600">
                            {iconMap[disasterManagementSteps[currentToolIndex]?.icon]}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-lg font-heading font-medium text-yellow-500 truncate mb-1">
                              {disasterManagementSteps[currentToolIndex]?.name}
                            </h4>
                            <p className="text-sm text-yellow-400 line-clamp-2 font-body leading-relaxed">
                              {disasterManagementSteps[currentToolIndex]?.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                  {/* Manual navigation buttons */}
                  {mode === "beginner" &&
                    selectedOption === "disasterManagement" &&
                    subMode !== "waiting_for_selection" &&
                    subMode !== "waiting_for_step_selection" &&
                    subMode !== "process_ended" && (
                      <div className="flex justify-between p-4 bg-black border-b-2 border-yellow-500 flex-shrink-0">
                        <button
                          disabled={true}
                          className="flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-heading font-medium text-gray-600 cursor-not-allowed bg-gray-800 border-2 border-gray-700"
                          aria-label="Previous step (disabled)"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          <span>Previous</span>
                        </button>
                        {currentToolIndex === disasterManagementSteps.length - 1 ? (
                          <button
                            onClick={endProcess}
                            disabled={isSpeaking}
                            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-heading font-medium transition-all duration-300 ${
                              isSpeaking
                                ? "text-gray-600 cursor-not-allowed bg-gray-800"
                                : "text-black bg-green-500 hover:bg-green-400 transform hover:scale-105 shadow-lg border-2 border-green-600"
                            }`}
                            aria-label="End disaster preparedness process"
                          >
                            <span>Complete</span>
                            <Sparkles className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            onClick={proceedToNextStep}
                            disabled={isSpeaking}
                            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-heading font-medium transition-all duration-300 ${
                              isSpeaking
                                ? "text-gray-600 cursor-not-allowed bg-gray-800"
                                : "text-black bg-yellow-500 hover:bg-yellow-400 transform hover:scale-105 shadow-lg border-2 border-yellow-600"
                            }`}
                            aria-label="Next step"
                          >
                            <span>Next</span>
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    )}

                  {/* Manual selection for beginner mode */}
                  {mode === "beginner" && subMode === "waiting_for_selection" && (
                    <div className="p-5 flex-shrink-0 overflow-y-auto bg-black">
                      <h3 className="text-lg font-heading font-medium text-yellow-500 mb-4">Select an option to continue:</h3>
                      <div className="grid grid-cols-1 gap-4">
                        <button
                          onClick={() => handleDashboardSelection()}
                          className="flex items-center space-x-4 p-4 bg-yellow-500/10 rounded-2xl border-2 border-yellow-500 hover:border-yellow-400 hover:bg-yellow-500/20 transition-all duration-300 transform hover:scale-105 shadow-lg"
                          aria-label="Explore dashboard tools"
                        >
                          <div className="bg-yellow-500 p-3 rounded-xl border-2 border-yellow-600">
                            {iconMap["Home"]}
                          </div>
                          <div className="text-left min-w-0 flex-1">
                            <div className="text-base font-heading font-medium text-yellow-500">Dashboard Tools</div>
                            <div className="text-sm text-yellow-400 font-body">Explore all emergency tools</div>
                          </div>
                        </button>
                        <button
                          onClick={() => handleDisasterManagementSelection()}
                          className="flex items-center space-x-4 p-4 bg-yellow-500/10 rounded-2xl border-2 border-yellow-500 hover:border-yellow-400 hover:bg-yellow-500/20 transition-all duration-300 transform hover:scale-105 shadow-lg"
                        >
                          <div className="bg-yellow-500 p-3 rounded-xl border-2 border-yellow-600">
                            {iconMap["AlertTriangle"]}
                          </div>
                          <div className="text-left min-w-0 flex-1">
                            <div className="text-base font-heading font-medium text-yellow-500">Preparedness Process</div>
                            <div className="text-sm text-yellow-400 font-body">Guided disaster response journey</div>
                          </div>
                        </button>
                      </div>
                      <div className="flex justify-between gap-3 mt-6">
                        <button
                          onClick={() => {
                            stopConversation()
                            setIsPanelOpen(false)
                          }}
                          className="flex-1 px-5 py-3 rounded-xl text-sm font-heading font-semibold text-black bg-red-500 hover:bg-red-400 transition-all duration-300 shadow-lg transform hover:scale-105 border-2 border-red-600"
                          aria-label="End conversation"
                        >
                          End Conversation
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Tool selection for dashboard */}
                  {mode === "beginner" && subMode === "waiting_for_tool_selection" && (
                    <div className="p-5 bg-black border-b-2 border-yellow-500 flex-shrink-0 overflow-y-auto max-h-72">
                      <h3 className="text-lg font-heading font-medium text-yellow-500 mb-4">Select a tool to explore:</h3>
                      <div className="grid grid-cols-1 gap-3 max-h-48 overflow-y-auto pb-2 space-y-2">
                        {dashboardRoutes.map((tool, index) => (
                          <button
                            key={index}
                            onClick={() => handleToolSelection(tool)}
                            className="flex items-center space-x-4 p-4 bg-yellow-500/10 rounded-xl border-2 border-yellow-500 hover:border-yellow-400 hover:bg-yellow-500/20 transition-all duration-300 transform hover:scale-105 shadow-lg group"
                            aria-label={`Select ${tool.name} tool`}
                            title={tool.description}
                          >
                            <div className="bg-yellow-500 p-2 rounded-lg border-2 border-yellow-600 group-hover:shadow-yellow-500/50 transition-all duration-300">
                              {iconMap[tool.icon]}
                            </div>
                            <div className="text-left min-w-0 flex-1">
                              <div className="text-sm font-heading font-medium truncate text-yellow-500">{tool.name}</div>
                              <div className="text-xs text-yellow-400 line-clamp-1 font-body">{tool.description}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                      <div className="flex justify-between gap-3 mt-4">
                        <button
                          onClick={async () => {
                            const prompt = "Returning to option selection."
                            setConversationHistory((prev) => [...prev, { type: "rakshak", text: prompt }])
                            await speakResponse(prompt)
                            setSubMode("waiting_for_selection")
                            setSelectedOption(null)
                          }}
                          className="flex-1 px-4 py-2 rounded-xl text-sm font-heading font-semibold text-black bg-yellow-500 hover:bg-yellow-400 transition-all duration-300 shadow-lg transform hover:scale-105 border-2 border-yellow-600"
                          aria-label="Go back to option selection"
                          title="Go back to option selection"
                        >
                          Back
                        </button>
                        <button
                          onClick={() => {
                            stopConversation()
                            setIsPanelOpen(false)
                          }}
                          className="flex-1 px-4 py-2 rounded-xl text-sm font-heading font-semibold text-black bg-red-500 hover:bg-red-400 transition-all duration-300 shadow-lg transform hover:scale-105 border-2 border-red-600"
                          aria-label="End conversation for tool selection"
                        >
                          End Conversation
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step selection for disaster management */}
                  {mode === "beginner" && subMode === "waiting_for_step_selection" && (
                    <div className="p-5 bg-black border-b-2 border-yellow-500 flex-shrink-0 overflow-y-auto max-h-96">
                      <h3 className="text-lg font-heading font-medium text-yellow-500 mb-4">Select a step to explore:</h3>
                      <div className="grid grid-cols-1 gap-3">
                        {disasterManagementSteps.map((step, index) => (
                          <button
                            key={index}
                            onClick={() => handleStepSelection(step)}
                            disabled={index !== currentToolIndex || completedSteps.includes(step.path)}
                            className={`flex items-center space-x-4 p-4 rounded-xl border-2 transition-all duration-300 transform ${
                              index !== currentToolIndex || completedSteps.includes(step.path)
                                ? "bg-gray-800/50 border-gray-700 opacity-50 cursor-not-allowed"
                                : "bg-yellow-500/10 border-yellow-500 hover:border-yellow-400 hover:bg-yellow-500/20 hover:scale-105 shadow-lg group"
                            }`}
                            aria-label={`${
                              index !== currentToolIndex || completedSteps.includes(step.path)
                                ? `${step.name} (locked)`
                                : `Select ${step.name}`
                            }`}
                            title={step.description}
                          >
                            <div
                              className={`p-2 rounded-lg border-2 transition-all duration-300 ${
                                completedSteps.includes(step.path)
                                  ? "bg-green-500/20 border-green-500"
                                  : index === currentToolIndex
                                  ? "bg-yellow-500 border-yellow-600 group-hover:shadow-yellow-500/50"
                                  : "bg-gray-800 border-gray-700"
                              }`}
                            >
                              {completedSteps.includes(step.path) ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <div className="text-black">{iconMap[step.icon]}</div>
                              )}
                            </div>
                            <div className="text-left min-w-0 flex-1">
                              <div className="text-sm font-heading font-medium truncate text-yellow-500">{step.name}</div>
                              <div className="text-xs text-yellow-400 line-clamp-2 font-body">{step.description}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                      <div className="flex justify-between gap-3 mt-4">
                        <button
                          onClick={async () => {
                            const prompt = "Returning to option selection."
                            setConversationHistory((prev) => [...prev, { type: "rakshak", text: prompt }])
                            await speakResponse(prompt)
                            setSubMode("waiting_for_selection")
                            setSelectedOption(null)
                          }}
                          className="flex-1 px-4 py-2 rounded-xl text-sm font-heading font-semibold text-black bg-yellow-500 hover:bg-yellow-400 transition-all duration-300 shadow-lg transform hover:scale-105 border-2 border-yellow-600"
                          aria-label="Go back to option selection"
                          title="Go back to option selection"
                        >
                          Back
                        </button>
                        <button
                          onClick={() => {
                            stopConversation()
                            setIsPanelOpen(false)
                          }}
                          className="flex-1 px-4 py-2 rounded-xl text-sm font-heading font-semibold text-black bg-red-500 hover:bg-red-400 transition-all duration-300 shadow-lg transform hover:scale-105 border-2 border-red-600"
                          aria-label="End conversation for step selection"
                        >
                          End Conversation
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Process ended options */}
                  {mode === "beginner" && subMode === "process_ended" && (
                    <div className="p-5 bg-black border-b-2 border-yellow-500 flex-shrink-0 overflow-y-auto">
                      <div className="text-center mb-4">
                        <div className="bg-green-500 p-4 rounded-2xl w-16 h-16 mx-auto mb-3 flex items-center justify-center border-2 border-green-600">
                          <Sparkles className="h-8 w-8 text-black" />
                        </div>
                        <h3 className="text-xl font-heading font-bold text-green-500 mb-2">Process Completed!</h3>
                        <p className="text-sm text-yellow-400 font-body">Congratulations on completing disaster preparedness</p>
                      </div>
                      <div className="grid grid-cols-1 gap-3">
                        <button
                          onClick={() => restartProcess()}
                          className="flex items-center space-x-3 p-4 bg-yellow-500/10 rounded-xl border-2 border-yellow-500 hover:border-yellow-400 hover:bg-yellow-500/20 transition-all duration-300 transform hover:scale-105 shadow-lg"
                          aria-label="Restart disaster preparedness process"
                        >
                          <div className="bg-yellow-500 p-2 rounded-lg border-2 border-yellow-600">
                            {iconMap["AlertTriangle"]}
                          </div>
                          <div className="text-left min-w-0 flex-1">
                            <div className="text-sm font-heading font-medium text-yellow-500">Restart Process</div>
                            <div className="text-xs text-yellow-400 font-body">Start preparedness training again</div>
                          </div>
                        </button>
                        <button
                          onClick={() => handleDashboardSelection()}
                          className="flex items-center space-x-3 p-4 bg-yellow-500/10 rounded-xl border-2 border-yellow-500 hover:border-yellow-400 hover:bg-yellow-500/20 transition-all duration-300 transform hover:scale-105 shadow-lg"
                          aria-label="Explore dashboard tools"
                        >
                          <div className="bg-yellow-500 p-2 rounded-lg border-2 border-yellow-600">
                            {iconMap["Home"]}
                          </div>
                          <div className="text-left min-w-0 flex-1">
                            <div className="text-sm font-heading font-medium text-yellow-500">Explore Tools</div>
                            <div className="text-xs text-yellow-400 font-body">Try other emergency features</div>
                          </div>
                        </button>
                        <button
                          onClick={() => {
                            setSubMode("waiting_for_selection")
                            const prompt = "Returning to option selection."
                            setConversationHistory((prev) => [...prev, { type: "rakshak", text: prompt }])
                            speakResponse(prompt)
                          }}
                          className="flex items-center space-x-3 p-4 bg-yellow-500/10 rounded-xl border-2 border-yellow-500 hover:border-yellow-400 hover:bg-yellow-500/20 transition-all duration-300 transform hover:scale-105 shadow-lg"
                          aria-label="Return to option selection"
                        >
                          <div className="bg-yellow-500 p-2 rounded-lg border-2 border-yellow-600">
                            {iconMap["Bot"]}
                          </div>
                          <div className="text-left min-w-0 flex-1">
                            <div className="text-sm font-heading font-medium text-yellow-500">Back to Options</div>
                            <div className="text-xs text-yellow-400 font-body">Choose between tools or training</div>
                          </div>
                        </button>
                      </div>
                      <div className="flex justify-between gap-3 mt-4">
                        <button
                          onClick={() => {
                            stopConversation()
                            setIsPanelOpen(false)
                          }}
                          className="flex-1 px-4 py-2 rounded-xl text-sm font-heading font-semibold text-black bg-red-500 hover:bg-red-400 transition-all duration-300 shadow-lg transform hover:scale-105 border-2 border-red-600"
                          aria-label="End conversation"
                        >
                          End Conversation
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Conversation History */}
                  <div
                    ref={conversationRef}
                    className="flex-1 overflow-y-auto p-5 space-y-4 min-h-[200px] max-h-[50vh] bg-black"
                  >
                    {conversationHistory.map((msg, index) => (
                      <div key={index} className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[85%] ${
                            msg.type === "user"
                              ? "bg-yellow-500 text-black rounded-tr-none shadow-lg border-2 border-yellow-600"
                              : "bg-gray-900 text-yellow-400 rounded-tl-none border-2 border-yellow-500 shadow-lg"
                          } rounded-2xl px-5 py-4 mb-2 transition-all duration-300 hover:shadow-xl`}
                        >
                          {msg.type === "rakshak" && (
                            <div className="flex items-center space-x-2 mb-2 pb-2 border-b-2 border-yellow-500">
                              <AlertTriangle className="h-4 w-4 text-yellow-500 animate-pulse" />
                              <span className="text-xs font-code font-bold text-yellow-500">RAKSHAK AI</span>
                              <div className="flex space-x-1">
                                <div className="w-1 h-1 bg-yellow-500 rounded-full animate-pulse"></div>
                                <div className="w-1 h-1 bg-yellow-400 rounded-full animate-pulse" style={{ animationDelay: "0.2s" }}></div>
                                <div className="w-1 h-1 bg-yellow-500 rounded-full animate-pulse" style={{ animationDelay: "0.4s" }}></div>
                              </div>
                            </div>
                          )}
                          <p className="text-sm whitespace-pre-wrap break-words font-body leading-relaxed">{msg.text}</p>
                        </div>
                      </div>
                    ))}
                    {(isLoading || isSpeaking) && (
                      <div className="flex justify-start">
                        <div className="max-w-[85%] w-full py-4 px-5 bg-gray-900 border-2 border-yellow-500 rounded-2xl shadow-lg">
                          <div className="flex items-center space-x-2 pb-2 border-b-2 border-yellow-500 mb-3">
                            <AlertTriangle className="h-4 w-4 text-yellow-500 animate-pulse" />
                            <span className="text-xs font-code font-bold text-yellow-500">RAKSHAK AI</span>
                            <div className="text-xs text-yellow-400 font-body">Processing...</div>
                          </div>
                          <div className="flex space-x-2 items-center">
                            <div className="h-3 w-2 bg-yellow-500 rounded-full animate-bounce"></div>
                            <div className="h-4 w-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                            <div className="h-5 w-2 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                            <div className="h-4 w-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: "0.3s" }}></div>
                            <div className="h-3 w-2 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {mode && (
                    <>
                      {/* Status Bar */}
                      <div className="px-5 py-3 mt-2 bg-gray-900 border-t-2 border-yellow-500 flex-shrink-0">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center space-x-3">
                            <div
                              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                                isListening
                                  ? "bg-green-500 animate-pulse shadow-lg shadow-green-500/50"
                                  : isSpeaking
                                  ? "bg-yellow-500 animate-pulse shadow-lg shadow-yellow-500/50"
                                  : "bg-gray-600"
                              }`}
                            ></div>
                            <span
                              className={`font-label font-medium ${
                                isListening ? "text-green-500" : isSpeaking ? "text-yellow-500" : "text-gray-400"
                              }`}
                            >
                              {isListening ? "Listening..." : isSpeaking ? "Speaking..." : "Ready"}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 text-yellow-400">
                            <span className="font-code text-xs">{conversationHistory.length} messages</span>
                            {mode === "doubt" && (
                              <div className="flex items-center space-x-1">
                                <Mic className="h-3 w-3" />
                                <span className="text-xs font-code">Voice Mode</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Input Area */}
                  <div className="p-5 border-t-2 border-yellow-500 flex-shrink-0 bg-black">
                    {mode === "doubt" && (
                      <div className="flex items-center justify-between px-5 py-3 rounded-2xl bg-gray-900 border-2 border-yellow-500 shadow-lg">
                        <div className="flex items-center space-x-3 text-sm">
                          {isListening && mode === "doubt" ? (
                            <>
                              <div className="relative">
                                <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping"></div>
                                <Mic className="h-6 w-6 text-green-500 animate-pulse" />
                              </div>
                              <div>
                                <span className="text-base font-heading font-medium text-green-500">Listening...</span>
                                <div className="text-xs text-yellow-400 font-body">Speak your question now</div>
                              </div>
                            </>
                          ) : (
                            <>
                              <MicOff className="h-6 w-6 text-red-500 animate-pulse" />
                              <div>
                                <span className="text-base font-heading font-medium text-red-500">Voice Paused</span>
                                <div className="text-xs text-yellow-400 font-body">Click Start to begin</div>
                              </div>
                            </>
                          )}
                        </div>
                        <button
                          onClick={() => (isListening ? stopConversation() : startConversation("doubt"))}
                          className={`flex items-center px-5 py-2 rounded-xl text-sm font-heading font-semibold text-black transition-all duration-300 transform hover:scale-105 shadow-lg border-2 ${
                            isListening
                              ? "bg-red-500 hover:bg-red-400 border-red-600"
                              : "bg-green-500 hover:bg-green-400 border-green-600"
                          }`}
                          aria-label="Start or stop voice conversation"
                        >
                          {isListening ? "Stop" : "Start"}
                        </button>
                      </div>
                    )}
                    {mode === "beginner" && subMode === "waiting_for_question" && (
                      <div className="flex flex-col space-y-4">
                        <input
                          type="text"
                          placeholder="Ask a question about this tool..."
                          className="w-full px-5 py-3 rounded-2xl border-2 border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-400 text-sm bg-gray-900 text-yellow-400 placeholder-gray-500 font-body transition-all duration-300"
                          onKeyDown={async (e) => {
                            if (e.key === "Enter" && e.target.value.trim()) {
                              setSubMode("resolving_doubt")
                              const query = e.target.value.trim()
                              setConversationHistory((prev) => [...prev, { type: "user", text: query }])
                              await fetchResponse(query)
                              e.target.value = ""
                            }
                          }}
                          aria-label="Ask a question about this tool"
                        />
                        {suggestedQuestions[targetRoute]?.length && (
                          <div className="flex flex-wrap gap-2">
                            {suggestedQuestions[targetRoute].map((q, index) => (
                              <button
                                key={index}
                                onClick={() => {
                                  setSubMode("resolving_doubt")
                                  setConversationHistory((prev) => [...prev, { type: "user", text: q }])
                                  fetchResponse(q)
                                }}
                                className="px-4 py-2 bg-yellow-500/20 text-yellow-400 rounded-xl text-xs hover:bg-yellow-500/30 hover:text-yellow-300 transition-all duration-300 font-body border-2 border-yellow-500/30 hover:border-yellow-500 transform hover:scale-105"
                                aria-label={`Ask suggested question: ${q}`}
                                title={`Ask suggested question: ${q}`}
                              >
                                {q}
                              </button>
                            ))}
                          </div>
                        )}
                        <div className="flex justify-end gap-3">
                          {selectedOption === "disasterManagement" && (
                            <button
                              onClick={() => proceedToNextStep()}
                              disabled={isSpeaking}
                              className="flex-1 px-5 py-3 rounded-xl bg-yellow-500 text-sm font-heading font-semibold text-black hover:bg-yellow-400 transition-all duration-300 shadow-lg transform hover:scale-105 border-2 border-yellow-600"
                              aria-label="Proceed to next step in disaster preparedness"
                            >
                              Next Step
                            </button>
                          )}
                          <button
                            onClick={async () => {
                              const prompt = `Returning to ${selectedOption === "disasterManagement" ? "step" : "tool"} selection.`
                              setConversationHistory((prev) => [...prev, { type: "rakshak", text: prompt }])
                              await speakResponse(prompt)
                              setSubMode(
                                selectedOption === "disasterManagement"
                                  ? "waiting_for_step_selection"
                                  : "waiting_for_tool_selection",
                              )
                            }}
                            disabled={isSpeaking}
                            className="flex-1 px-5 py-3 rounded-xl text-sm font-heading font-semibold text-black bg-yellow-600 hover:bg-yellow-500 transition-all duration-300 shadow-lg transform hover:scale-105 border-2 border-yellow-700"
                            aria-label={`Select another ${selectedOption === "disasterManagement" ? "step" : "tool"}`}
                          >
                            Select Another {selectedOption === "disasterManagement" ? "Step" : "Tool"}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Help text */}
                    <div className="mt-4 py-3 px-5 bg-yellow-500/10 rounded-xl border-2 border-yellow-500">
                      <div className="text-xs text-center text-yellow-400 leading-relaxed font-body flex items-center justify-center space-x-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-500 animate-pulse" />
                        <span>Rakshak specializes in disaster management, emergency response, and safety awareness</span>
                        <Shield className="h-4 w-4 text-yellow-500 animate-pulse" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}