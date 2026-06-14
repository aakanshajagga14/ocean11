import React from "react";
export default (props) => {
	return (
		<div className="flex flex-col bg-white">
			<div className="flex flex-col self-stretch bg-[#051424] pb-0.5 gap-16">
				<div className="flex justify-between items-center self-stretch bg-[#051424] px-6">
					<div className="flex shrink-0 items-center">
						<img
							src={"https://lh3.googleusercontent.com/aida/AP1WRLtveduqtiLF_2grDFfcE8URajrzq-3JOdCqYvuTGOVs4iTjVXLJz2VsT7jREp4mwVjELHa20Q5RVCxMMF1FYka_olvaGepGXImhNOsydicPkHInC9HW6QPD5uqrEO3pwELY1sUJG-CVcShQfXKjd92z-p2EiX_R-AuXtmbaKmnb2dg-t1KBsOhP1ffK3L_12_n4P5H9sF5M7MBhHTRK059I1QbuhsalkrxoNHM8FwetvBmLRTb-Wo6XotIS"} 
							className="w-8 h-8 mr-4 object-fill"
						/>
						<div className="flex flex-col shrink-0 items-start mr-[11px]">
							<span className="text-[#FFB690] text-2xl font-bold mr-[101px]" >
								{"Ocean11"}
							</span>
							<span className="text-[#E0C0B1] text-base" >
								{"Maritime Intelligence"}
							</span>
						</div>
					</div>
					<div className="flex shrink-0 items-center">
						<span className="text-[#E0C0B1] text-base w-[69px] mr-8" >
							{"Live Map"}
						</span>
						<span className="text-[#E0C0B1] text-base w-[107px] mr-[31px]" >
							{"Investigations"}
						</span>
						<span className="text-[#FFB690] text-base font-bold mr-8" >
							{"Reports"}
						</span>
						<span className="text-[#E0C0B1] text-base w-11" >
							{"Alerts"}
						</span>
					</div>
					<div className="flex shrink-0 items-center gap-5">
						<div className="flex flex-col shrink-0 items-center">
							<button className="flex items-center bg-[#0D1C2D] text-left py-[5px] px-4 rounded border border-solid border-[#584237]"
								onClick={()=>alert("Pressed!")}>
								<span className="text-[#D4E4FA] text-sm mr-[66px]" >
									{"Search reports..."}
								</span>
								<img
									src={"https://storage.googleapis.com/tagjs-prod.appspot.com/v1/12tR1oP5Zh/qg36d18v_expires_30_days.png"} 
									className="w-6 h-6 object-fill"
								/>
							</button>
						</div>
						<img
							src={"https://storage.googleapis.com/tagjs-prod.appspot.com/v1/12tR1oP5Zh/k3qob3gj_expires_30_days.png"} 
							className="w-6 h-6 object-fill"
						/>
						<img
							src={"https://storage.googleapis.com/tagjs-prod.appspot.com/v1/12tR1oP5Zh/q1z0gshl_expires_30_days.png"} 
							className="w-6 h-6 object-fill"
						/>
						<button className="flex flex-col shrink-0 items-start bg-[#273647] text-left py-[3px] px-[1px] rounded-xl border border-solid border-[#584237]"
							onClick={()=>alert("Pressed!")}>
							<img
								src={"https://storage.googleapis.com/tagjs-prod.appspot.com/v1/12tR1oP5Zh/06u2eg2c_expires_30_days.png"} 
								className="w-6 h-6 rounded-xl object-fill"
							/>
						</button>
					</div>
				</div>
				<div className="flex flex-col self-stretch pt-6 pb-[38px] px-6 gap-6">
					<div className="flex justify-between items-start self-stretch">
						<div className="flex flex-col shrink-0 items-start">
							<span className="text-[#D4E4FA] text-[32px] font-bold mr-[45px]" >
								{"Escalation Reports"}
							</span>
							<span className="text-[#E0C0B1] text-sm" >
								{"AI-generated humanitarian intervention packages"}
							</span>
						</div>
						<div className="flex shrink-0 items-center mt-5 gap-4">
							<button className="flex shrink-0 items-center bg-[#1C2B3C] text-left py-2 px-[17px] gap-1 rounded border border-solid border-[#584237]"
								onClick={()=>alert("Pressed!")}>
								<span className="text-[#D4E4FA] text-sm" >
									{"All Urgency Levels"}
								</span>
								<img
									src={"https://storage.googleapis.com/tagjs-prod.appspot.com/v1/12tR1oP5Zh/t9w0dywi_expires_30_days.png"} 
									className="w-3.5 h-3.5 rounded object-fill"
								/>
							</button>
							<button className="flex shrink-0 items-center bg-[#F97316] text-left py-2 px-6 gap-1 rounded border-0"
								onClick={()=>alert("Pressed!")}>
								<img
									src={"https://storage.googleapis.com/tagjs-prod.appspot.com/v1/12tR1oP5Zh/0fsgdbxo_expires_30_days.png"} 
									className="w-3.5 h-3.5 rounded object-fill"
								/>
								<span className="text-[#582200] text-base" >
									{"Export All"}
								</span>
							</button>
						</div>
					</div>
					<div className="flex items-center self-stretch gap-4">
						<div className="flex flex-1 flex-col items-start bg-[#122131] py-[17px] pl-[17px] rounded border border-solid border-[#584237]">
							<span className="text-[#E0C0B1] text-xs font-bold" >
								{"Total Reports"}
							</span>
							<span className="text-[#D4E4FA] text-2xl font-bold" >
								{"847"}
							</span>
						</div>
						<div className="flex flex-1 flex-col items-start bg-[#122131] py-[17px] pl-5 rounded border border-solid border-[#584237]">
							<span className="text-[#E0C0B1] text-xs font-bold" >
								{"Escalated"}
							</span>
							<span className="text-[#FFB4AB] text-2xl font-bold" >
								{"23"}
							</span>
						</div>
						<div className="flex flex-1 flex-col items-start bg-[#122131] py-[17px] pl-5 rounded border border-solid border-[#584237]">
							<span className="text-[#E0C0B1] text-xs font-bold" >
								{"Monitored"}
							</span>
							<span className="text-[#F97316] text-2xl font-bold" >
								{"156"}
							</span>
						</div>
						<div className="flex flex-1 flex-col items-start bg-[#122131] py-[17px] pl-[17px] rounded border border-solid border-[#584237]">
							<span className="text-[#E0C0B1] text-xs font-bold" >
								{"No Action"}
							</span>
							<span className="text-[#D4E4FA] text-2xl font-bold" >
								{"668"}
							</span>
						</div>
					</div>
					<div className="flex flex-col self-stretch gap-4">
						<div className="flex items-center self-stretch">
							<div className="flex flex-1 flex-col items-start bg-[#122131] pt-[1px] mr-4 rounded border border-solid border-[#584237]">
								<div className="self-stretch bg-[#FFB4AB] h-1 mb-3 mx-[1px]">
								</div>
								<div className="flex justify-between items-center self-stretch mb-4 mx-[17px]">
									<div className="flex flex-col shrink-0 items-start bg-[#FFB4AB1A] py-1 px-2 rounded-sm">
										<span className="text-[#FFB4AB] text-[11px] font-bold" >
											{"Immediate"}
										</span>
									</div>
									<span className="text-[#E0C0B1] text-[11px]" >
										{"14 Jun 2026 14:32"}
									</span>
								</div>
								<div className="flex flex-col items-start mb-[25px] ml-[17px]">
									<span className="text-[#D4E4FA] text-base mr-[83px]" >
										{"MV ESPERANZA"}
									</span>
									<span className="text-[#E0C0B1] text-[11px]" >
										{"MMSI: 235086842 | IMO: 9345263"}
									</span>
								</div>
								<div className="flex items-center self-stretch mb-[25px] mx-[17px]">
									<div className="flex flex-col shrink-0 items-start">
										<span className="text-[#E0C0B1] text-[11px]" >
											{"Risk Score"}
										</span>
										<span className="text-[#FFB4AB] text-sm font-bold mr-4" >
											{"91/100"}
										</span>
									</div>
									<div className="flex-1 self-stretch">
									</div>
									<div className="flex flex-col shrink-0 items-center">
										<span className="text-[#E0C0B1] text-[11px]" >
											{"Crew / Days"}
										</span>
										<span className="text-[#D4E4FA] text-sm" >
											{"18 / 47d"}
										</span>
									</div>
									<div className="flex-1 self-stretch">
									</div>
								</div>
								<span className="text-[#E0C0B1] text-sm mb-4 mx-[17px]" >
									{""Owner Oceanic Holdings Ltd unreachable for 96h; vessel drifting near territorial waters...""}
								</span>
								<div className="flex items-center mb-4 ml-[17px] gap-1">
									<div className="flex flex-col shrink-0 items-start bg-[#1C2B3C] py-[5px] px-[9px] rounded-sm border border-solid border-[#584237]">
										<span className="text-[#D4E4FA] text-[11px]" >
											{"ITF"}
										</span>
									</div>
									<div className="flex flex-col shrink-0 items-start bg-[#1C2B3C] py-[5px] pl-[9px] pr-[22px] rounded-sm border border-solid border-[#584237]">
										<span className="text-[#D4E4FA] text-[11px]" >
											{"COMOROS MCA"}
										</span>
									</div>
									<div className="flex flex-col shrink-0 items-start bg-[#1C2B3C] py-[5px] px-[9px] rounded-sm border border-solid border-[#584237]">
										<span className="text-[#D4E4FA] text-[11px]" >
											{"PORT SUDAN"}
										</span>
									</div>
								</div>
								<div className="flex items-center mb-[17px] ml-[17px] gap-[7px]">
									<span className="text-[#F97316] text-base" >
										{"VIEW REPORT"}
									</span>
									<img
										src={"https://storage.googleapis.com/tagjs-prod.appspot.com/v1/12tR1oP5Zh/2n1rr5mc_expires_30_days.png"} 
										className="w-6 h-6 object-fill"
									/>
								</div>
							</div>
							<div className="flex flex-1 flex-col items-start bg-[#122131] pt-[1px] mr-[17px] rounded border border-solid border-[#584237]">
								<div className="self-stretch bg-[#F97316] h-1 mb-3 mx-[1px]">
								</div>
								<div className="flex justify-between items-center self-stretch mb-4 mx-[17px]">
									<div className="flex flex-col shrink-0 items-start bg-[#F973161A] py-1 px-2 rounded-sm">
										<span className="text-[#F97316] text-[11px] font-bold" >
											{"Urgent"}
										</span>
									</div>
									<span className="text-[#E0C0B1] text-[11px]" >
										{"13 Jun 2026 09:15"}
									</span>
								</div>
								<div className="flex flex-col items-start mb-[25px] ml-[17px]">
									<span className="text-[#D4E4FA] text-base mr-[54px]" >
										{"MT HORIZON STAR"}
									</span>
									<span className="text-[#E0C0B1] text-[11px]" >
										{"MMSI: 477123900 | IMO: 9283744"}
									</span>
								</div>
								<div className="flex items-center self-stretch mb-[25px] mx-[17px]">
									<div className="flex flex-col shrink-0 items-start">
										<span className="text-[#E0C0B1] text-[11px]" >
											{"Risk Score"}
										</span>
										<span className="text-[#F97316] text-sm font-bold mr-4" >
											{"78/100"}
										</span>
									</div>
									<div className="flex-1 self-stretch">
									</div>
									<div className="flex flex-col shrink-0 items-center">
										<span className="text-[#E0C0B1] text-[11px]" >
											{"Crew / Days"}
										</span>
										<span className="text-[#D4E4FA] text-sm" >
											{"22 / 31d"}
										</span>
									</div>
									<div className="flex-1 self-stretch">
									</div>
								</div>
								<span className="text-[#E0C0B1] text-sm mb-4 mx-[17px]" >
									{""AIS dark 72h; fuel reserves estimated at <5%. Multiple distress pings recorded...""}
								</span>
								<div className="flex items-center mb-4 ml-[17px] gap-1">
									<div className="flex flex-col shrink-0 items-start bg-[#1C2B3C] py-[5px] px-[9px] rounded-sm border border-solid border-[#584237]">
										<span className="text-[#D4E4FA] text-[11px]" >
											{"ITF"}
										</span>
									</div>
									<div className="flex flex-col shrink-0 items-start bg-[#1C2B3C] py-[5px] px-[9px] rounded-sm border border-solid border-[#584237]">
										<span className="text-[#D4E4FA] text-[11px]" >
											{"UKRAINE MCA"}
										</span>
									</div>
									<div className="flex flex-col shrink-0 items-start bg-[#1C2B3C] py-[5px] px-[9px] rounded-sm border border-solid border-[#584237]">
										<span className="text-[#D4E4FA] text-[11px]" >
											{"DJIBOUTI PORT"}
										</span>
									</div>
								</div>
								<div className="flex items-center mb-[17px] ml-[17px] gap-[7px]">
									<span className="text-[#F97316] text-base" >
										{"VIEW REPORT"}
									</span>
									<img
										src={"https://storage.googleapis.com/tagjs-prod.appspot.com/v1/12tR1oP5Zh/fieqpsoa_expires_30_days.png"} 
										className="w-6 h-6 object-fill"
									/>
								</div>
							</div>
							<div className="flex flex-1 flex-col items-start bg-[#122131] pt-[1px] rounded border border-solid border-[#584237]">
								<div className="self-stretch bg-[#F97316] h-1 mb-3 mx-[1px]">
								</div>
								<div className="flex justify-between items-center self-stretch mb-4 mx-[17px]">
									<div className="flex flex-col shrink-0 items-start bg-[#F973161A] py-1 px-2 rounded-sm">
										<span className="text-[#F97316] text-[11px] font-bold" >
											{"Urgent"}
										</span>
									</div>
									<span className="text-[#E0C0B1] text-[11px]" >
										{"12 Jun 2026 11:40"}
									</span>
								</div>
								<div className="flex flex-col items-start mb-[25px] ml-[17px]">
									<span className="text-[#D4E4FA] text-base mr-[54px]" >
										{"MV KONSTANTINOS"}
									</span>
									<span className="text-[#E0C0B1] text-[11px]" >
										{"MMSI: 229000123 | IMO: 9112233"}
									</span>
								</div>
								<div className="flex items-center self-stretch mb-[25px] mx-[17px]">
									<div className="flex flex-col shrink-0 items-start">
										<span className="text-[#E0C0B1] text-[11px]" >
											{"Risk Score"}
										</span>
										<span className="text-[#F97316] text-sm font-bold mr-4" >
											{"74/100"}
										</span>
									</div>
									<div className="flex-1 self-stretch">
									</div>
									<div className="flex flex-col shrink-0 items-center">
										<span className="text-[#E0C0B1] text-[11px]" >
											{"Crew / Days"}
										</span>
										<span className="text-[#D4E4FA] text-sm" >
											{"14 / 62d"}
										</span>
									</div>
									<div className="flex-1 self-stretch">
									</div>
								</div>
								<span className="text-[#E0C0B1] text-sm mb-4 mx-[17px]" >
									{""Crew complaint filed via ITF for wage non-payment exceeding 2 months...""}
								</span>
								<div className="flex items-center mb-4 ml-[17px] gap-1">
									<div className="flex flex-col shrink-0 items-start bg-[#1C2B3C] py-[5px] px-[9px] rounded-sm border border-solid border-[#584237]">
										<span className="text-[#D4E4FA] text-[11px]" >
											{"ITF"}
										</span>
									</div>
									<div className="flex flex-col shrink-0 items-start bg-[#1C2B3C] py-[5px] px-[9px] rounded-sm border border-solid border-[#584237]">
										<span className="text-[#D4E4FA] text-[11px]" >
											{"GREECE MCA"}
										</span>
									</div>
									<div className="flex flex-col shrink-0 items-start bg-[#1C2B3C] py-[5px] px-[9px] rounded-sm border border-solid border-[#584237]">
										<span className="text-[#D4E4FA] text-[11px]" >
											{"PIRAEUS PORT"}
										</span>
									</div>
								</div>
								<div className="flex items-center mb-[17px] ml-[17px] gap-[7px]">
									<span className="text-[#F97316] text-base" >
										{"VIEW REPORT"}
									</span>
									<img
										src={"https://storage.googleapis.com/tagjs-prod.appspot.com/v1/12tR1oP5Zh/2sis488h_expires_30_days.png"} 
										className="w-6 h-6 object-fill"
									/>
								</div>
							</div>
						</div>
						<div className="flex items-center self-stretch">
							<div className="flex flex-1 flex-col items-start bg-[#122131] pt-[1px] mr-4 rounded border border-solid border-[#584237]">
								<div className="self-stretch bg-[#FFB690] h-1 mb-3 mx-[1px]">
								</div>
								<div className="flex justify-between items-center self-stretch mb-4 mx-[17px]">
									<div className="flex flex-col shrink-0 items-start bg-[#FFB6901A] py-1 px-2 rounded-sm">
										<span className="text-[#FFB690] text-[11px] font-bold" >
											{"Monitor"}
										</span>
									</div>
									<span className="text-[#E0C0B1] text-[11px]" >
										{"11 Jun 2026 08:20"}
									</span>
								</div>
								<div className="flex flex-col items-start mb-[25px] ml-[17px]">
									<span className="text-[#D4E4FA] text-base mr-[54px]" >
										{"MV PACIFIC DAWN"}
									</span>
									<span className="text-[#E0C0B1] text-[11px]" >
										{"MMSI: 354009211 | IMO: 9556781"}
									</span>
								</div>
								<div className="flex items-center self-stretch mb-[25px] mx-[17px]">
									<div className="flex flex-col shrink-0 items-start">
										<span className="text-[#E0C0B1] text-[11px]" >
											{"Risk Score"}
										</span>
										<span className="text-[#D4E4FA] text-sm font-bold mr-4" >
											{"58/100"}
										</span>
									</div>
									<div className="flex-1 self-stretch">
									</div>
									<div className="flex flex-col shrink-0 items-center">
										<span className="text-[#E0C0B1] text-[11px]" >
											{"Crew / Days"}
										</span>
										<span className="text-[#D4E4FA] text-sm" >
											{"19 / 12d"}
										</span>
									</div>
									<div className="flex-1 self-stretch">
									</div>
								</div>
								<span className="text-[#E0C0B1] text-sm mb-4 mx-[17px]" >
									{""Elevated stationary period outside of known port zone. Likely waiting for orders.""}
								</span>
								<div className="flex flex-col items-start bg-[#1C2B3C] py-[5px] px-[9px] mb-4 ml-[17px] rounded-sm border border-solid border-[#584237]">
									<span className="text-[#D4E4FA] text-[11px]" >
										{"MONITOR ONLY"}
									</span>
								</div>
								<div className="flex items-center mb-[17px] ml-[17px] gap-[7px]">
									<span className="text-[#F97316] text-base" >
										{"VIEW REPORT"}
									</span>
									<img
										src={"https://storage.googleapis.com/tagjs-prod.appspot.com/v1/12tR1oP5Zh/oki7rbwx_expires_30_days.png"} 
										className="w-6 h-6 object-fill"
									/>
								</div>
							</div>
							<div className="flex flex-1 flex-col items-start bg-[#122131] pt-[1px] mr-[17px] rounded border border-solid border-[#584237]">
								<div className="self-stretch bg-[#FFB690] h-1 mb-3 mx-[1px]">
								</div>
								<div className="flex justify-between items-center self-stretch mb-4 mx-[17px]">
									<div className="flex flex-col shrink-0 items-start bg-[#FFB6901A] py-1 px-2 rounded-sm">
										<span className="text-[#FFB690] text-[11px] font-bold" >
											{"Monitor"}
										</span>
									</div>
									<span className="text-[#E0C0B1] text-[11px]" >
										{"10 Jun 2026 16:45"}
									</span>
								</div>
								<div className="flex flex-col items-start mb-[25px] ml-[17px]">
									<span className="text-[#D4E4FA] text-base mr-16" >
										{"MV OCEAN GLORY"}
									</span>
									<span className="text-[#E0C0B1] text-[11px]" >
										{"MMSI: 231445000 | IMO: 9223344"}
									</span>
								</div>
								<div className="flex items-center self-stretch mb-[25px] mx-[17px]">
									<div className="flex flex-col shrink-0 items-start">
										<span className="text-[#E0C0B1] text-[11px]" >
											{"Risk Score"}
										</span>
										<span className="text-[#D4E4FA] text-sm font-bold mr-4" >
											{"52/100"}
										</span>
									</div>
									<div className="flex-1 self-stretch">
									</div>
									<div className="flex flex-col shrink-0 items-start">
										<span className="text-[#E0C0B1] text-[11px]" >
											{"Crew / Days"}
										</span>
										<span className="text-[#D4E4FA] text-sm mr-3.5" >
											{"16 / 8d"}
										</span>
									</div>
									<div className="flex-1 self-stretch">
									</div>
								</div>
								<span className="text-[#E0C0B1] text-sm mb-4 mx-[17px]" >
									{""Irregular movement pattern observed in the Mediterranean. Cross-referencing cargo.""}
								</span>
								<div className="flex flex-col items-start bg-[#1C2B3C] py-[5px] px-[9px] mb-4 ml-[17px] rounded-sm border border-solid border-[#584237]">
									<span className="text-[#D4E4FA] text-[11px]" >
										{"MONITOR ONLY"}
									</span>
								</div>
								<div className="flex items-center mb-[17px] ml-[17px] gap-[7px]">
									<span className="text-[#F97316] text-base" >
										{"VIEW REPORT"}
									</span>
									<img
										src={"https://storage.googleapis.com/tagjs-prod.appspot.com/v1/12tR1oP5Zh/qfvxgwuh_expires_30_days.png"} 
										className="w-6 h-6 object-fill"
									/>
								</div>
							</div>
							<div className="flex flex-1 flex-col items-start bg-[#122131] pt-[1px] rounded border border-solid border-[#584237]">
								<div className="self-stretch bg-[#584237] h-1 mb-3 mx-[1px]">
								</div>
								<div className="flex justify-between items-center self-stretch mb-4 mx-[17px]">
									<div className="flex flex-col shrink-0 items-start bg-[#5842371A] py-1 px-2 rounded-sm">
										<span className="text-[#E0C0B1] text-[11px] font-bold" >
											{"None"}
										</span>
									</div>
									<span className="text-[#E0C0B1] text-[11px]" >
										{"09 Jun 2026 13:10"}
									</span>
								</div>
								<div className="flex flex-col items-start mb-[25px] ml-[17px]">
									<span className="text-[#D4E4FA] text-base mr-4" >
										{"MV ATLANTIC PIONEER"}
									</span>
									<span className="text-[#E0C0B1] text-[11px]" >
										{"MMSI: 563000999 | IMO: 9887711"}
									</span>
								</div>
								<div className="flex items-center self-stretch mb-[25px] mx-[17px]">
									<div className="flex flex-col shrink-0 items-start">
										<span className="text-[#E0C0B1] text-[11px]" >
											{"Risk Score"}
										</span>
										<span className="text-[#D4E4FA] text-sm font-bold mr-4" >
											{"31/100"}
										</span>
									</div>
									<div className="flex-1 self-stretch">
									</div>
									<div className="flex flex-col shrink-0 items-start">
										<span className="text-[#E0C0B1] text-[11px]" >
											{"Crew / Days"}
										</span>
										<span className="text-[#D4E4FA] text-sm mr-3.5" >
											{"24 / 0d"}
										</span>
									</div>
									<div className="flex-1 self-stretch">
									</div>
								</div>
								<span className="text-[#E0C0B1] text-sm mb-4 mx-[17px]" >
									{""Active vessel within normal operation parameters. No significant anomalies detected.""}
								</span>
								<div className="flex flex-col items-start bg-[#1C2B3C] py-[5px] px-[9px] mb-4 ml-[17px] rounded-sm border border-solid border-[#584237]">
									<span className="text-[#D4E4FA] text-[11px]" >
										{"NO ACTION"}
									</span>
								</div>
								<div className="flex items-center mb-[17px] ml-[17px] gap-[7px]">
									<span className="text-[#F97316] text-base" >
										{"VIEW REPORT"}
									</span>
									<img
										src={"https://storage.googleapis.com/tagjs-prod.appspot.com/v1/12tR1oP5Zh/tk341iau_expires_30_days.png"} 
										className="w-6 h-6 object-fill"
									/>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}