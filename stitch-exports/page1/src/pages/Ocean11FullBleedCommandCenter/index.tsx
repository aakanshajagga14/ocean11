import React from "react";
export default (props) => {
	return (
		<div className="flex flex-col bg-white">
			<div className="self-stretch bg-[#050A14] pb-[226px]">
				<div className="flex justify-between items-center self-stretch bg-[#051424] px-6">
					<div className="flex shrink-0 items-center">
						<img
							src={"https://storage.googleapis.com/tagjs-prod.appspot.com/v1/12tR1oP5Zh/AAAGSURBVAMAQaTmdBT3_expires_30_days.png"} 
							className="w-8 h-8 mr-4 object-fill"
						/>
						<div className="flex flex-col shrink-0 items-start mr-[11px]">
							<span className="text-[#FFB690] text-2xl font-bold mr-[76px]" >
								{"Ocean11"}
							</span>
							<span className="text-[#E0C0B1] text-sm" >
								{"Maritime Intelligence"}
							</span>
						</div>
					</div>
					<div className="flex shrink-0 items-center gap-8">
						<span className="text-[#FFB690] text-sm font-bold" >
							{"Live Map"}
						</span>
						<span className="text-[#E0C0B1] text-sm w-[95px]" >
							{"Investigations"}
						</span>
						<span className="text-[#E0C0B1] text-sm w-[52px]" >
							{"Reports"}
						</span>
						<span className="text-[#E0C0B1] text-sm w-10" >
							{"Alerts"}
						</span>
					</div>
					<div className="flex shrink-0 items-center">
						<img
							src={"https://storage.googleapis.com/tagjs-prod.appspot.com/v1/12tR1oP5Zh/p91uz6nw_expires_30_days.png"} 
							className="w-6 h-6 mr-5 object-fill"
						/>
						<img
							src={"https://storage.googleapis.com/tagjs-prod.appspot.com/v1/12tR1oP5Zh/u00jfw9i_expires_30_days.png"} 
							className="w-6 h-6 mr-[19px] object-fill"
						/>
						<button className="flex flex-col shrink-0 items-start bg-[#273647] text-left py-[3px] px-[1px] rounded-xl border border-solid border-[#584237]"
							onClick={()=>alert("Pressed!")}>
							<img
								src={"https://storage.googleapis.com/tagjs-prod.appspot.com/v1/12tR1oP5Zh/kb2ebi9l_expires_30_days.png"} 
								className="w-6 h-6 rounded-xl object-fill"
							/>
						</button>
					</div>
				</div>
				<div className="flex items-center self-stretch bg-[#051424] py-4 px-6 gap-4">
					<div className="flex flex-1 items-center bg-[#122131] py-[17px] rounded-sm border border-solid border-[#584237]">
						<button className="flex flex-col shrink-0 items-start bg-[#3A4859] text-left p-2 ml-[17px] mr-4 rounded-sm border-0"
							onClick={()=>alert("Pressed!")}>
							<img
								src={"https://storage.googleapis.com/tagjs-prod.appspot.com/v1/12tR1oP5Zh/9xl34dqj_expires_30_days.png"} 
								className="w-6 h-6 rounded-sm object-fill"
							/>
						</button>
						<div className="flex flex-col shrink-0 items-center">
							<div className="flex flex-col items-start">
								<span className="text-[#D4E4FA] text-[32px] mr-[60px]" >
									{"847"}
								</span>
								<span className="text-[#E0C0B1] text-xs font-bold" >
									{"Vessels Monitored"}
								</span>
							</div>
						</div>
					</div>
					<div className="flex flex-1 items-center bg-[#122131] py-[17px] rounded-sm border border-solid border-[#584237]">
						<button className="flex flex-col shrink-0 items-start bg-[#93000A4D] text-left p-2 ml-[17px] mr-4 rounded-sm border-0"
							onClick={()=>alert("Pressed!")}>
							<img
								src={"https://storage.googleapis.com/tagjs-prod.appspot.com/v1/12tR1oP5Zh/q6v0lspe_expires_30_days.png"} 
								className="w-6 h-6 rounded-sm object-fill"
							/>
						</button>
						<div className="flex flex-col shrink-0 items-center">
							<div className="flex flex-col items-start">
								<span className="text-[#D4E4FA] text-[32px] mr-[76px]" >
									{"23"}
								</span>
								<span className="text-[#E0C0B1] text-xs font-bold" >
									{"High Risk Vessels"}
								</span>
							</div>
						</div>
					</div>
					<div className="flex flex-1 items-center bg-[#122131] py-[17px] rounded-sm border border-solid border-[#584237]">
						<button className="flex flex-col shrink-0 items-start bg-[#F9731633] text-left p-2 ml-[17px] mr-4 rounded-sm border-0"
							onClick={()=>alert("Pressed!")}>
							<img
								src={"https://storage.googleapis.com/tagjs-prod.appspot.com/v1/12tR1oP5Zh/d638r4ex_expires_30_days.png"} 
								className="w-6 h-6 rounded-sm object-fill"
							/>
						</button>
						<div className="flex flex-col shrink-0 items-center">
							<div className="flex flex-col items-start">
								<span className="text-[#D4E4FA] text-[32px] mr-[63px]" >
									{"7"}
								</span>
								<span className="text-[#E0C0B1] text-xs font-bold" >
									{"Active Alerts"}
								</span>
							</div>
						</div>
					</div>
					<div className="flex flex-1 items-center bg-[#122131] py-[17px] rounded-sm border border-solid border-[#584237]">
						<button className="flex flex-col shrink-0 items-start bg-[#273647] text-left p-2 ml-[17px] mr-4 rounded-sm border-0"
							onClick={()=>alert("Pressed!")}>
							<img
								src={"https://storage.googleapis.com/tagjs-prod.appspot.com/v1/12tR1oP5Zh/sa0nav6o_expires_30_days.png"} 
								className="w-6 h-6 rounded-sm object-fill"
							/>
						</button>
						<div className="flex flex-col shrink-0 items-center">
							<div className="flex flex-col items-start">
								<span className="text-[#D4E4FA] text-[32px] mr-[114px]" >
									{"4"}
								</span>
								<span className="text-[#E0C0B1] text-xs font-bold" >
									{"Active Investigations"}
								</span>
							</div>
						</div>
					</div>
				</div>
				<div className="flex items-center self-stretch">
					<div className="flex flex-1 flex-col items-start bg-cover bg-center pt-4"
						style={{
							backgroundImage: 'url(https://storage.googleapis.com/tagjs-prod.appspot.com/v1/12tR1oP5Zh/r5jmbnsk_expires_30_days.png)',
						}}
						>
						<div className="flex items-start mb-[170px] ml-4">
							<div className="flex flex-col shrink-0 items-center mr-[106px]">
								<button className="flex flex-col items-start bg-[#1C2B3C] text-left p-2 mb-2 rounded-sm border border-solid border-[#584237]"
									onClick={()=>alert("Pressed!")}>
									<img
										src={"https://storage.googleapis.com/tagjs-prod.appspot.com/v1/12tR1oP5Zh/c9kdzho0_expires_30_days.png"} 
										className="w-6 h-6 rounded-sm object-fill"
									/>
								</button>
								<button className="flex flex-col items-start bg-[#1C2B3C] text-left p-2 mb-3 rounded-sm border border-solid border-[#584237]"
									onClick={()=>alert("Pressed!")}>
									<img
										src={"https://storage.googleapis.com/tagjs-prod.appspot.com/v1/12tR1oP5Zh/eswx9g68_expires_30_days.png"} 
										className="w-6 h-6 rounded-sm object-fill"
									/>
								</button>
								<div className="bg-[#584237] w-8 h-[1px] mb-3">
								</div>
								<button className="flex flex-col items-start bg-[#1C2B3C] text-left p-2 mb-2 rounded-sm border border-solid border-[#584237]"
									onClick={()=>alert("Pressed!")}>
									<img
										src={"https://storage.googleapis.com/tagjs-prod.appspot.com/v1/12tR1oP5Zh/er8mr5j1_expires_30_days.png"} 
										className="w-6 h-6 rounded-sm object-fill"
									/>
								</button>
								<div className="flex flex-col items-start bg-[#1C2B3C] p-[1px] rounded-sm border border-solid border-[#584237]">
									<span className="text-[#D4E4FA] text-sm text-center w-10" >
										{"+"}
									</span>
									<div className="bg-[#584237] w-10 h-[1px]">
									</div>
									<span className="text-[#D4E4FA] text-sm text-center w-10" >
										{"−"}
									</span>
								</div>
							</div>
							<div className="flex flex-col shrink-0 items-start mt-[236px]">
								<button className="flex flex-col items-start bg-[#F97316] text-left p-[5px] mb-11 ml-[258px] rounded-xl border border-solid border-[#F97316]"
									onClick={()=>alert("Pressed!")}>
									<span className="text-[#552100] text-xs font-bold" >
										{"24"}
									</span>
								</button>
								<div className="flex flex-col items-center mb-[65px] ml-[352px]">
									<img
										src={"https://storage.googleapis.com/tagjs-prod.appspot.com/v1/12tR1oP5Zh/qbiapenw_expires_30_days.png"} 
										className="w-6 h-6 object-fill"
									/>
								</div>
								<div className="bg-[#FFB4AB] w-3 h-3 mb-[35px] ml-[123px] rounded-xl" 
									style={{
										boxShadow: "0px 0px 8px #FFB4AB"
									}}>
								</div>
								<button className="flex flex-col items-start bg-[#FFB4AB33] text-left py-1.5 px-3 mb-[43px] ml-[168px] rounded-xl border border-solid border-[#FFB4AB]"
									onClick={()=>alert("Pressed!")}>
									<span className="text-[#FFB4AB] text-xs font-bold" >
										{"7"}
									</span>
								</button>
								<div className="flex flex-col items-center">
									<img
										src={"https://storage.googleapis.com/tagjs-prod.appspot.com/v1/12tR1oP5Zh/ozgq3rt3_expires_30_days.png"} 
										className="w-6 h-6 object-fill"
									/>
								</div>
							</div>
						</div>
						<div className="flex flex-col self-stretch bg-[#0D1C2D] py-[18px] px-4 gap-2">
							<div className="flex justify-between items-center self-stretch">
								<span className="text-[#D4E4FA] text-xs font-bold" >
									{"Active Alerts"}
								</span>
								<span className="text-[#FFB690] text-xs font-bold" >
									{"View all"}
								</span>
							</div>
							<div className="flex items-center self-stretch gap-4">
								<div className="flex flex-1 flex-col bg-[#122131] pt-[13px] px-4 gap-1 border border-solid border-[#584237]">
									<div className="flex justify-between items-center self-stretch">
										<span className="text-[#D4E4FA] text-sm font-bold" >
											{"MV Esperanza"}
										</span>
										<div className="flex flex-col shrink-0 items-start bg-[#FFB4AB1A] py-0.5 px-1.5 rounded-sm">
											<span className="text-[#FFB4AB] text-[10px] font-bold" >
												{"CRITICAL"}
											</span>
										</div>
									</div>
									<div className="flex justify-between items-center self-stretch">
										<span className="text-[#E0C0B1] text-[11px]" >
											{"Stationary for 47 days"}
										</span>
										<span className="text-[#E0C0B1] text-[10px]" >
											{"2m ago"}
										</span>
									</div>
								</div>
								<div className="flex flex-1 flex-col bg-[#122131] pt-[13px] px-4 gap-1 border border-solid border-[#584237]">
									<div className="flex justify-between items-center self-stretch">
										<span className="text-[#D4E4FA] text-sm font-bold" >
											{"MT Horizon Star"}
										</span>
										<div className="flex flex-col shrink-0 items-start bg-[#F973161A] py-0.5 px-1.5 rounded-sm">
											<span className="text-[#F97316] text-[10px] font-bold" >
												{"HIGH"}
											</span>
										</div>
									</div>
									<div className="flex justify-between items-center self-stretch">
										<span className="text-[#E0C0B1] text-[11px]" >
											{"AIS gap for 36 hours"}
										</span>
										<span className="text-[#E0C0B1] text-[10px]" >
											{"15m ago"}
										</span>
									</div>
								</div>
								<div className="flex flex-col shrink-0 items-start bg-[#122131] pt-[13px] pl-4 gap-1 border border-solid border-[#584237]">
									<div className="flex flex-col items-start pb-1 pr-[49px]">
										<span className="text-[#D4E4FA] text-sm font-bold" >
											{"MV Ocean Glory"}
										</span>
									</div>
									<span className="text-[#E0C0B1] text-[11px]" >
										{"Irregular movement detected"}
									</span>
								</div>
							</div>
						</div>
					</div>
					<div className="flex flex-col shrink-0 items-center bg-[#051424] pt-4 px-[1px]">
						<div className="flex items-start mb-[17px]">
							<div className="flex flex-col shrink-0 items-start mr-[170px]">
								<span className="text-[#E0C0B1] text-[11px] font-bold mb-1 mr-[94px]" >
									{"Vessel Focus"}
								</span>
								<span className="text-[#D4E4FA] text-sm mb-2 mr-[73px]" >
									{"MV ESPERANZA"}
								</span>
								<div className="flex items-center gap-2">
									<div className="flex flex-col shrink-0 items-start bg-[#FFB4AB1A] py-0.5 px-2 rounded-sm">
										<span className="text-[#FFB4AB] text-[11px] font-bold" >
											{"Critical Risk"}
										</span>
									</div>
									<span className="text-[#E0C0B1] text-[11px]" >
										{"IMO 9123456"}
									</span>
								</div>
							</div>
							<img
								src={"https://storage.googleapis.com/tagjs-prod.appspot.com/v1/12tR1oP5Zh/r0voxt84_expires_30_days.png"} 
								className="w-6 h-6 object-fill"
							/>
						</div>
						<div className="flex flex-col items-center">
							<div className="flex items-center pt-[170px] pb-2 pl-3 pr-48 gap-2" 
								style={{
									background: "linear-gradient(180deg, #051424, #00000000, #00000000)"
								}}>
								<img
									src={"https://storage.googleapis.com/tagjs-prod.appspot.com/v1/12tR1oP5Zh/otmzszvy_expires_30_days.png"} 
									className="w-3.5 h-3.5 object-fill"
								/>
								<span className="text-[#E0C0B1] text-[11px]" >
									{"Last Photo: 1h ago • Arabian Sea"}
								</span>
							</div>
							<div className="flex items-center bg-[#051424] py-[11px] mb-4">
								<span className="text-[#FFB690] text-xs font-bold ml-8 mr-[43px]" >
									{"Overview"}
								</span>
								<span className="text-[#E0C0B1] text-xs font-bold mr-[90px]" >
									{"Voyage"}
								</span>
								<span className="text-[#E0C0B1] text-xs font-bold mr-[83px]" >
									{"History"}
								</span>
							</div>
							<div className="flex flex-col items-start gap-4">
								<div className="flex flex-col items-start bg-[#122131] p-[17px] gap-4 rounded-sm border border-solid border-[#584237]">
									<div className="flex items-start">
										<div className="flex flex-col shrink-0 items-start mr-[179px] gap-[3px]">
											<span className="text-[#E0C0B1] text-[11px] font-bold mr-6" >
												{"RISK SCORE"}
											</span>
											<span className="text-[#F97316] text-[44px] font-bold" >
												{"91 /100"}
											</span>
										</div>
										<div className="flex flex-col shrink-0 items-start mt-[13px] gap-2">
											<img
												src={"https://storage.googleapis.com/tagjs-prod.appspot.com/v1/12tR1oP5Zh/ac1p9t7l_expires_30_days.png"} 
												className="w-16 h-8 object-fill"
											/>
											<span className="text-[#FFB4AB] text-[11px] font-bold ml-3.5" >
												{"Critical"}
											</span>
										</div>
									</div>
									<div className="flex flex-col items-start">
										<div className="flex items-center mb-1">
											<span className="text-[#E0C0B1] text-[10px] font-bold mr-[107px]" >
												{"Confidence Interval (0.73)"}
											</span>
											<span className="text-[#E0C0B1] text-[10px] font-bold" >
												{"Range: 78 - 97"}
											</span>
										</div>
										<div className="flex flex-col items-start bg-[#273647] pl-[259px] pr-[11px] mb-3 rounded-xl">
											<div className="items-start bg-[#F973164D] pl-11 pr-[7px] rounded-xl">
												<div className="bg-[#F97316] w-3 h-1.5 rounded-xl">
												</div>
											</div>
										</div>
										<span className="text-[#E0C0B1] text-[11px] mr-[30px]" >
											{""Moderate data confidence — AIS gaps detected""}
										</span>
									</div>
								</div>
								<div className="flex flex-col items-start ml-3.5 gap-1">
									<span className="text-[#F97316] text-[11px] font-bold mr-[241px]" >
										{"System Projection"}
									</span>
									<span className="text-[#D4E4FA] text-sm w-[353px]" >
										{"High probability of abandonment. Vessel behavior consistent with distressed maritime assets in this corridor."}
									</span>
								</div>
								<div className="flex items-center gap-3">
									<div className="flex flex-col shrink-0 items-start bg-[#122131] py-[9px] pl-[13px] pr-[65px] gap-1 rounded-sm border border-solid border-[#584237]">
										<span className="text-[#E0C0B1] text-[11px]" >
											{"DAYS STATIONARY"}
										</span>
										<span className="text-[#D4E4FA] text-xl font-bold" >
											{"47 days"}
										</span>
									</div>
									<div className="flex flex-col shrink-0 items-start bg-[#122131] py-[9px] pl-[13px] pr-[117px] gap-1 rounded-sm border border-solid border-[#584237]">
										<span className="text-[#E0C0B1] text-[11px]" >
											{"AIS GAP"}
										</span>
										<span className="text-[#D4E4FA] text-xl font-bold" >
											{"72 h"}
										</span>
									</div>
								</div>
							</div>
						</div>
						<div className="flex flex-col items-start bg-[#122131] p-4 gap-4">
							<button className="flex items-center bg-[#F97316] text-left py-3.5 px-[88px] gap-3 rounded-sm border-0"
								onClick={()=>alert("Pressed!")}>
								<img
									src={"https://storage.googleapis.com/tagjs-prod.appspot.com/v1/12tR1oP5Zh/owh1v1pa_expires_30_days.png"} 
									className="w-5 h-5 rounded-sm object-fill"
								/>
								<span className="text-[#552100] text-sm font-bold" >
									{"START INVESTIGATION"}
								</span>
							</button>
							<button className="flex items-center bg-transparent text-left py-3 px-[76px] gap-3 rounded-sm border border-solid border-[#F97316]"
								onClick={()=>alert("Pressed!")}>
								<img
									src={"https://storage.googleapis.com/tagjs-prod.appspot.com/v1/12tR1oP5Zh/u7favjz3_expires_30_days.png"} 
									className="w-6 h-6 rounded-sm object-fill"
								/>
								<span className="text-[#F97316] text-sm font-bold" >
									{"MONITOR ON WATCHLIST"}
								</span>
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}