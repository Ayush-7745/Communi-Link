import { User, HeartHandshake, Building2 } from 'lucide-react';
import { motion } from 'motion/react';
import logo from '../../imports/logo.jpeg';

export function RoleSelection() {
  return (
    <div className="min-h-screen bg-[#0A0F1E] flex flex-col font-sans relative overflow-hidden">
      <style>{`
        .role-card-border::before {
          content: "";
          position: absolute;
          inset: -2px;
          border-radius: inherit;
          background: linear-gradient(
            120deg,
            #3b82f6, #8b5cf6, #06b6d4, #3b82f6
          );
          background-size: 300% 300%;
          opacity: 0;
          transition: opacity 0.3s ease;
          z-index: -1;
        }
        .role-card-border:hover::before {
          opacity: 1;
          animation: borderMove 3s linear infinite;
        }
        @keyframes borderMove {
          0% { background-position: 0% 50%; }
          100% { background-position: 100% 50%; }
        }
      `}</style>

      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Header */}
      <header className="w-full flex justify-between items-center py-6 px-10 relative z-10">
        <div className="flex items-center gap-4">
          <div className="p-1 rounded-xl bg-gradient-to-tr from-white/10 to-white/5 shadow-lg border border-white/10 backdrop-blur-sm">
            <img src={logo} alt="Communi-Link" className="h-8 w-auto rounded-lg object-contain bg-white" />
          </div>
          <span className="text-white text-xl font-bold tracking-wide">Communi-Link</span>
        </div>
        <a
          href="/login"
          className="px-6 py-2.5 rounded-lg bg-[#151C2C] text-sm text-white font-medium hover:bg-[#1E273A] transition-colors border border-gray-700/50 hover:border-gray-600 shadow-lg"
        >
          Sign In
        </a>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 -mt-10 relative z-10">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-5xl md:text-7xl font-extrabold text-white mb-4 text-center tracking-tight"
        >
          Empower Your <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4F9AFD] via-[#A87FFB] to-[#45D1E8]">
            Community
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-gray-400 mt-6 max-w-2xl text-center text-[15px] md:text-[17px] leading-relaxed"
        >
          A smart resource allocation and issue-tracking platform. Connect citizens, volunteers, and NGOs to build a stronger and safer society together.
        </motion.p>

        {/* Cards Grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-5xl w-full"
        >
          {/* Citizen Card */}
          <motion.a
            href="/signup?role=citizen"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="role-card-border relative group flex flex-col items-center p-8 bg-[#151C2C] rounded-[32px] cursor-pointer hover:shadow-[0_20px_40px_rgba(0,0,0,0.3)] transition-all duration-300 h-full border border-gray-800/80 hover:border-transparent isolation-auto"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent rounded-[32px]"></div>
            <div className="w-16 h-16 bg-[#2563EB]/10 rounded-[20px] flex items-center justify-center mb-6 text-[#60A5FA] group-hover:scale-110 transition-transform duration-300 shadow-[0_0_20px_rgba(59,130,246,0.1)]">
              <User size={30} strokeWidth={2} />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3 tracking-wide">Citizen</h3>
            <p className="text-gray-400 text-center text-sm leading-relaxed mb-8 flex-1 px-2 relative z-10">
              Report issues directly from your neighborhood and track progress in real-time.
            </p>
            <span className="text-[#60A5FA] text-[15px] font-semibold group-hover:text-blue-300 transition-colors flex items-center gap-1.5 relative z-10">
              Join as Citizen <span className="text-lg translate-y-[1px] group-hover:translate-x-1 transition-transform">→</span>
            </span>
          </motion.a>

          {/* Volunteer Card */}
          <motion.a
            href="/signup?role=volunteer"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="role-card-border relative group flex flex-col items-center p-8 bg-[#151C2C] rounded-[32px] cursor-pointer hover:shadow-[0_20px_40px_rgba(0,0,0,0.3)] transition-all duration-300 h-full border border-gray-800/80 hover:border-transparent isolation-auto"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent rounded-[32px]"></div>
            <div className="w-16 h-16 bg-[#9333EA]/10 rounded-[20px] flex items-center justify-center mb-6 text-[#C084FC] group-hover:scale-110 transition-transform duration-300 shadow-[0_0_20px_rgba(147,51,234,0.1)]">
              <HeartHandshake size={30} strokeWidth={2} />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3 tracking-wide">Volunteer</h3>
            <p className="text-gray-400 text-center text-sm leading-relaxed mb-8 flex-1 px-2 relative z-10">
              Find physical tasks, leverage your skills, and make a tangible impact nearby.
            </p>
            <span className="text-[#C084FC] text-[15px] font-semibold group-hover:text-purple-300 transition-colors flex items-center gap-1.5 relative z-10">
              Join as Volunteer <span className="text-lg translate-y-[1px] group-hover:translate-x-1 transition-transform">→</span>
            </span>
          </motion.a>

          {/* NGO Card */}
          <motion.a
            href="/signup?role=ngo"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="role-card-border relative group flex flex-col items-center p-8 bg-[#151C2C] rounded-[32px] cursor-pointer hover:shadow-[0_20px_40px_rgba(0,0,0,0.3)] transition-all duration-300 h-full border border-gray-800/80 hover:border-transparent isolation-auto"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent rounded-[32px]"></div>
            <div className="w-16 h-16 bg-[#0891B2]/10 rounded-[20px] flex items-center justify-center mb-6 text-[#22D3EE] group-hover:scale-110 transition-transform duration-300 shadow-[0_0_20px_rgba(8,145,178,0.1)]">
              <Building2 size={30} strokeWidth={2} />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3 tracking-wide">NGO</h3>
            <p className="text-gray-400 text-center text-sm leading-relaxed mb-8 flex-1 px-2 relative z-10">
              Manage incoming issues, coordinate tasks, and oversee volunteer deployments effectively.
            </p>
            <span className="text-[#22D3EE] text-[15px] font-semibold group-hover:text-cyan-300 transition-colors flex items-center gap-1.5 relative z-10">
              Join as NGO <span className="text-lg translate-y-[1px] group-hover:translate-x-1 transition-transform">→</span>
            </span>
          </motion.a>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 mt-24 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-10 py-14">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">

            {/* Brand Column */}
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-3">
                <div className="p-1 rounded-xl bg-gradient-to-tr from-white/10 to-white/5 shadow-lg border border-white/10 backdrop-blur-sm">
                  <img src={logo} alt="Communi-Link" className="h-8 w-auto rounded-lg object-contain bg-white" />
                </div>
                <span className="text-white text-lg font-bold tracking-wide">Communi-Link</span>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
                Connecting communities through technology. Reporting issues, managing resources, and empowering change, one link at a time.
              </p>
            </div>

            {/* Platform Column */}
            <div className="flex flex-col gap-5">
              <h4 className="text-white text-sm font-semibold tracking-widest uppercase">Platform</h4>
              <ul className="flex flex-col gap-3">
                <li>
                  <a href="/signup?role=citizen" className="text-gray-400 text-sm hover:text-white transition-colors">
                    Citizen Portal
                  </a>
                </li>
                <li>
                  <a href="/signup?role=ngo" className="text-gray-400 text-sm hover:text-white transition-colors">
                    NGO Hub
                  </a>
                </li>
                <li>
                  <a href="/signup?role=volunteer" className="text-gray-400 text-sm hover:text-white transition-colors">
                    Volunteer Network
                  </a>
                </li>
              </ul>
            </div>

            {/* Support Column */}
            <div className="flex flex-col gap-5">
              <h4 className="text-white text-sm font-semibold tracking-widest uppercase">Support</h4>
              <ul className="flex flex-col gap-3">
                <li>
                  <a href="mailto:support@communilink.org" className="text-gray-400 text-sm hover:text-white transition-colors">
                    Contact Us
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 text-sm hover:text-white transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 text-sm hover:text-white transition-colors">
                    Terms of Use
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/[0.06]">
          <div className="max-w-6xl mx-auto px-10 py-5 flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-gray-600 text-xs">
              © 2026 Communi-Link Platform. Engineered for social impact.
            </p>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-gray-500 text-xs tracking-widest uppercase">Operational</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
